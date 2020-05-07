const AWS = require('aws-sdk')
require('dotenv').config();
const Table = require('cli-table');
const colors = require('colors');

const creds = {
  apiVersion: '2017-10-25',
  region: 'us-east-1',
}

const costExplorer = new AWS.CostExplorer(creds);

// AWS Cost Explorer API doesn't track data for more than 1 year
const now = new Date()
const endDate = now.toISOString().slice(0, 10)
now.setYear(now.getFullYear() - 1)
const startDate = now.toISOString().slice(0, 10)

const ceParams = {
  TimePeriod: {
    Start: startDate,
    End: endDate
  },
  Granularity: 'MONTHLY',
  Metrics: [
    'BlendedCost',
    'UsageQuantity'
  ],
  GroupBy: [{
    Key: 'REGION',
    Type: 'DIMENSION'
  },
  {
     Key: 'SERVICE',
    Type: 'DIMENSION'
  }]
}

const nonInfrastructureCosts = [
  'Tax', 'AWS Support (Business)'
]

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

/** Calculates green vs grey cost for an object sorted by key..
 *  Such as for a map sorted by key 'region', it will decorate with greenPercent and greyPercent:
 *  {
 *    'us-east-1': { greenCost: 123, greyCost: 123, greenPercent: 20, greyPercent: 80 }
 *  }
 */
function calculateGreenPortions(costMap) {

  const costPerRegion = {};


  for (const [key, value] of costMap.entries()) {
    if (nonInfrastructureCosts.includes(key)) {
      continue
    }
    const greenReducer = (accumulator, currentValue) => {
      if (nonInfrastructureCosts.includes(currentValue.service)) {
        return accumulator
      } else if (currentValue.greenRegion) {
        return (accumulator + currentValue.blendedCost);
      } else {
        return accumulator;
      }
    };

    const grayReducer = (accumulator, currentValue) => {
      if (nonInfrastructureCosts.includes(currentValue.service)) {
        return accumulator
      } else if (!currentValue.greenRegion) {
        return (accumulator + currentValue.blendedCost);
      } else {
        return accumulator;
      }
    };

    const greenSum = value.reduce(greenReducer, 0);
    const greySum = value.reduce(grayReducer, 0);

    const greenPercent = greenSum / (greySum + greenSum) * 100;
    const greyPercent = 100 - greenPercent;

    costPerRegion[key] = { greenCost: greenSum, greyCost: greySum, greenPercent: greenPercent, greyPercent: greyPercent };
  };
  return costPerRegion;
}

/**
 * Aggregates an object of key => cost mappings into a single line of cost items.
 */
function aggregateTotalCost(cost) {

  let totalGreenSum = 0;
  let totalGreySum = 0;

  Object.values(cost).forEach((item) => {
    totalGreenSum = totalGreenSum + item.greenCost;
    totalGreySum = totalGreySum + item.greyCost;
  })

  const greenPercent = totalGreenSum / (totalGreySum + totalGreenSum) * 100;
  const greyPercent = 100 - greenPercent;

  return { greenCost: totalGreenSum.toFixed(2), greyCost: totalGreySum.toFixed(2), greenPercent: greenPercent.toFixed(1), greyPercent: greyPercent.toFixed(1) };
}

/**
 * Given the raw output of CostExplorer.getCostAndUsage(), decorates the data with `greenRegion: true/false` and returns a map with result sets by a given key.
 * E.g. summing by key 'region':
 * {
 *   'us-east-1' => [ {region: 'us-east-1'}, greenRegion: false, blendedCost: 1, month: '2018-08-01'},
 *                    {region: 'us-east-1'}, greenRegion: false, blendedCost: 2, month: '2018-09-01'}],
 *   'eu-west-1' => [ {region: 'eu-west-'}, greenRegion: true, blendedCost: 1, month: '2018-08-01'},
 *   ]
 * }
 */
function sumByKey(costArray, sumBy) {
  const groupedCost = new Map();
  costArray.forEach((item) => {
    const key = item[sumBy];
    const collection = groupedCost.get(key);
    if (item.blendedCost === 0) return;
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
      return { region: data.Keys[0], blendedCost: Number.parseFloat(data.Metrics.BlendedCost.Amount), greenRegion: greenRegions.includes(data.Keys[0]), month: month, service: data.Keys[1]};
    });

    costPerRegion = costPerRegion.concat(costItem);
  });

  return costPerRegion;
}

/**
 * Sorts a cost object by a given key.
 * Create an array, sort the array, then transform back into an object.
 *
 */
function sortBy(costObject, key) {
  const sortedCostArray = [];
  const sortedCostObject = {};

  Object.entries(costObject).forEach(([k, v]) => {
     sortedCostArray.push([k, v]);
  });

  sortedCostArray.sort(function(a, b) {
        return b[1][key] - a[1][key];
  });

  sortedCostArray.forEach(([k, v]) => {
    sortedCostObject[k] = v;
  });
  return sortedCostObject;
}

function printData(costObject) {
  const table = new Table({
        head: ['Total Green Cost'.green, 'Total Grey Cost'.red],
        colWidths: [30, 30]
  });

  table.push([`${costObject.greenPercent}% ($${costObject.greenCost})`,
`${costObject.greyPercent}% ($${costObject.greyCost})`]);

  console.log(table.toString());
}

function printDataByKey(costObject, key) {
  const table = new Table({
        head: [`${key}`.white, `Green Cost by ${key}`.green, `Grey Cost by ${key}`.red],
        colWidths: [30, 30, 30]
  });

  Object.entries(costObject).forEach(([key, item]) => {
    table.push([`${key}`, `${item.greenPercent.toFixed(1)}% ($${item.greenCost.toFixed(2)})`,
                `${item.greyPercent.toFixed(1)}% ($${item.greyCost.toFixed(2)})`]);
  });

  console.log(table.toString());
}

async function runExplorer() {

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('Unable to locate credentials. Please export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    return;
  }

  const rawCost = await getRawCosts();

  const assignedCost = await getAssignedCost(rawCost);

  const groupedByRegion = sumByKey(assignedCost, 'region');
  const groupedByMonth = sumByKey(assignedCost, 'month');
  const groupedByService = sumByKey(assignedCost, 'service');

  const costMap = calculateGreenPortions(groupedByRegion);
  const total = aggregateTotalCost(costMap);

  const costByMonth = calculateGreenPortions(groupedByMonth);
  const costByService = calculateGreenPortions(groupedByService);
  const sortedCostByService = sortBy(costByService, 'greenCost');

  printData(total);
  printDataByKey(costByMonth, 'month');
  printDataByKey(sortedCostByService, 'service');
}

module.exports = {
  getRawCosts,
  getAssignedCost,
  aggregateTotalCost,
  runExplorer
}
