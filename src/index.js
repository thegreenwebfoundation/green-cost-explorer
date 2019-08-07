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
    Key: 'AZ',
    Type: "DIMENSION"
  }]
}
// give us an awaitable function
async function getCosts() {
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

module.exports = {
  getCosts
}

