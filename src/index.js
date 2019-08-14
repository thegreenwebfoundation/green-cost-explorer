const AWS = require("aws-sdk")
require('dotenv').config();
const Table = require('cli-table');
const colors = require('colors');

const creds = {
  apiVersion: '2017-10-25',
  region: 'us-east-1',
}

const costExplorer = new AWS.CostExplorer(creds);

const ceParams = {
  // Start=2018-08-01,End=2019-05-01
  TimePeriod: { /* required */
    Start: '2018-08-01', /* required */
    End: '2019-05-01' /* required */
  },
  Granularity: "MONTHLY",
  Metrics: [
    "BlendedCost",
    "UsageQuantity"
  ],
  GroupBy: [{
    Key: 'REGION',
    Type: "DIMENSION"
  }]
}

// give us an awaitable function
async function getRawCosts() {
  return new Promise(function (resolve, reject) {
    costExplorer.getCostAndUsage(ceParams, function (err, data) {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

function mapToJson(map) {
    return JSON.stringify([...map]);
}

/** Given the output of `getAssignedCost`
 *  returns green vs grey cost by month.
 *  Such as:
 *  [
 *    { greenCost: 123, greyCost: 123, greenPercent: 20, greyPercent: 80, month: 'August 2018' },
 *    { greenCost: 123, greyCost: 123, greenPercent: 20, greyPercent: 80, month: 'September 2018' }
 *  ]
 */
function getCostByMonth(groupedCost) {

}

/** Given the output of `getAssignedCost`
 *  returns green vs grey cost.
 *  Such as:
 *  { greenCost: 123, greyCost: 123, greenPercent: 20, greyPercent: 80 }
 */
function getTotalCost(groupedCost) {

  const costPerRegion = {};

  for (const [key, value] of groupedCost.entries()) {

    const greenReducer = (accumulator, currentValue) => {
      if (currentValue.greenRegion) {
        return (accumulator + currentValue.blendedCost);
      } else {
        return accumulator;
      }
    };

    const grayReducer = (accumulator, currentValue) => {
     if (!currentValue.greenRegion) {
        return (accumulator + currentValue.blendedCost);
      } else {
        return accumulator;
      }
    };

    const greenSum = value.reduce(greenReducer, 0);
    const greySum = value.reduce(grayReducer, 0);

    costPerRegion[key] = { greenCost: greenSum, greyCost: greySum};
  };

  let totalGreenCost = 0;
  let totalGreyCost = 0;

  Object.values(costPerRegion).forEach((region) => {
    totalGreenCost = totalGreenCost + region.greenCost;
    totalGreyCost = totalGreyCost + region.greyCost;
  })

  const greenPercent = totalGreenCost / (totalGreyCost + totalGreenCost) * 100;
  const greyPercent = 100 - greenPercent;

  return { greenCost: totalGreenCost.toFixed(2), greyCost: totalGreyCost.toFixed(2), greenPercent: greenPercent.toFixed(1), greyPercent: greyPercent.toFixed(1) };
}

/**
 * Given the raw output of CostExplorer.getCostAndUsage(), decorates the data with `greenRegion: true/false` and returns a map with result sets by a given key.
 * E.g. summing by "region":
 * {
 *   'us-east-1' => [ {region: 'us-east-1'}, greenRegion: false, blendedCost: 1, month: '2018-08-01'},
 *                    {region: 'us-east-1'}, greenRegion: false, blendedCost: 2, month: '2018-09-01'}],
 *   'eu-west-1' => [ {region: 'eu-west-'}, greenRegion: true, blendedCost: 1, month: '2018-08-01'},
 *   ]
 * }
 */
function sumByKey(costArray, key) {
  const groupedCost = new Map();
  costArray.forEach((item) => {
    const key = item.key;
    const collection = groupedCost.get(key);
    if (!collection) {
      groupedCost.set(key, [item]);
    } else {
      collection.push(item);
    }
  });

  return groupedCost;
}

/**
 *
 * Returns an array of cost entries given the raw data from CostExplorer.getCostandUsage()
 * Such as:
 * [
 *   { region: 'us-east-1', blendedCost: 123.45, greenRegion: false, month: '2018-08-01'},
 *   { region: 'eu-west-1', blendedCost: 123.45, greenRegion: true, month: '2018-08-01'}
 * ]
 */
async function getAssignedCost(raw) {
  const greenRegions = ['us-west-2','eu-central-1', 'eu-west-1','ca-central-1','us-gov-west-1'];

  let costPerRegion = [];
  raw.ResultsByTime.forEach((result) => {

    const month = (result.TimePeriod ? result.TimePeriod.Start : 'n/a');
    const costItem = result.Groups.map((data) => {
      return { region: data.Keys[0], blendedCost: Number.parseFloat(data.Metrics.BlendedCost.Amount), greenRegion: greenRegions.includes(data.Keys[0]), month: month};
    });

    costPerRegion = costPerRegion.concat(costItem);
  });

  return costPerRegion;
}

function printData(costObject) {
  const table = new Table({
        head: ['Green Cost'.green, 'Grey Cost'.red],
        colWidths: [30, 30]
  });

  table.push([`${costObject.greenPercent}% ($${costObject.greenCost})`,
`${costObject.greyPercent}% ($${costObject.greyCost})`]);

  console.log(table.toString());
}

async function runExplorer() {
  const rawCost = await getRawCosts();
  const assignedCost = await getAssignedCost(rawCost);
  const groupedByRegion = sumByKey(assignedCost, 'region');
  const groupedByMonth = sumByKey(assignedCost, 'month');
  const total = getTotalCost(groupedByRegion);
  const costByMonth = getCostByMonth(groupedByMonth);

  printData(total);
//  printData(costByMonth);
}

module.exports = {
  getRawCosts,
  getAssignedCost,
  getTotalCost,
  runExplorer
}
