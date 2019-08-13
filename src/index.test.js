const costExplorer = require('./index');
const rawSampleData = new Map(require('../data/sampledata.json'));

describe("GreenCost", () => {
  describe("ReshapeforChart", () => {
    test("splits results into green and grey buckets", async () => {

      const result = await costExplorer.getTotalCost(rawSampleData);
      const expected = { greenCost: "146.66", greyCost: "152.48", greenPercent: "49.0", greyPercent: "51.0" };
      expect(result).toEqual(expected);
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
