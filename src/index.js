const AWS = require("aws-sdk")

const creds = {
  apiVersion: '2017-10-25',
  region: 'us-east-1',
}

const costExplorer = new AWS.CostExplorer(creds);

const ceParams = {
  // Start=2018-08-01,End=2019-05-01
  TimePeriod: { /* required */
    Start: '2019-04-01', /* required */
    End: '2019-04-02' /* required */
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
      console.log({ data })
      resolve(data)
    })
  })
}

async function getAssignedCost(raw) {
  const greenRegions = ['us-west-2','eu-central-1', 'eu-west-1','ca-central-1','us-gov-west-1'];
  console.log('-------- Raw cost -------');
  console.log(JSON.stringify(raw, null, 2));
  console.log('-------- Raw cost -------');

  const greenData = [];
  raw.ResultsByTime.forEach((result) => {
    const greenResults = result.Groups
      .filter((group) => greenRegions.includes(group.Keys[0]));
    console.log('green result: ', greenResults);
    greenData.push(greenResults);
  });
  return greenData;
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
