// const fsPromise = require('fspromises')
const fs = require('fs')
const path = require('path');

const costExplorer = require('./index');



// const rawSampleData = fsPromises.readFile('../data/sample-with-service-breakdown.json');
const rawSampleData = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/sample-with-service-breakdown.json'), 'utf8'));

describe("GreenCost", () => {
  describe("ReshapeforChart", () => {

    test.todo("[index] getRawCost: fetches raw cost data from AWS CostExplorer");
    test.todo("[index] getAssignedCost: assigns cost by region");
    test.todo("[index] sumByRegion: sums total cost by region");

    test("[index] getTotalCost: splits results into green and grey buckets", async () => {


      // const assignedCost = await costExplorer.getAssignedCost(rawSampleData);
      // const costMap = calculateGreenPortions(groupedByRegion);
      // const groupedByRegion = sumByKey(assignedCost, 'region');
      // const total = aggregateTotalCost(costMap);

    });

    test.todo("it totals up spend by month, comparing green vs grey spend")
    test.todo("it gives a percentage each month, and in total of spend on green vs grey regions")
  })
  describe("ProjectSpendForwards", () => {
    test.todo("it projects spend forward 12 months")
  })
  describe("ConvertSpendToCO2Figures", () => {
    // it's worth referring to Merrin's figures here, and ideally bulding on them
    // to share back
    test.todo("provides estimated CO2 emissions based on spend")
  })
})
