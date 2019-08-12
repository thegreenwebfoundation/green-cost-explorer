const AWS = require("aws-sdk")

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

async function getAssignedCost(raw) {
  const greenRegions = ['us-west-2','eu-central-1', 'eu-west-1','ca-central-1','us-gov-west-1'];

  let costPerRegion = [];
  raw.ResultsByTime.forEach((result) => {
    const costItem = result.Groups.map((data) => {
      return { region: data.Keys, blendedCost: data.Metrics.BlendedCost.Amount, greenRegion: greenRegions.includes(data.Keys[0])};
    });
    costPerRegion = costPerRegion.concat(costItem);
  });

  return costPerRegion;
}

async function runExplorer() {
  const rawCost = await getRawCosts();
  const assignedCost = await getAssignedCost(rawCost);
  return assignedCost;
}

module.exports = {
  getRawCosts,
  runExplorer
}
