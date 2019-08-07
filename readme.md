# Green Cost Explorer - climate related spend analysis for AWS

If you work in technology, it's reasonable to think that you have some respect for science.

And if you have some respect for science, then you'll understand why spending a significant of your monthly AWS bills on fossil fuel powered infrastructure isn't a thing we can afford to do anymore.

Because Amazon provide a helpful breakdown of which [regions you use run on what they refer to as sustainable power, and which ones do not][1], and [because they provide a cost-explorer tool][2], you combine this information to get an idea of where you might be spending money on fossil fuels without realising.

[1]: https://aws.amazon.com/about-aws/sustainability/
[2]: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CostExplorer.html#getCostAndUsage-property

### What this does

TODO

- Sort your monthly spend into green vs grey spend
- Create a basic table showing this
- Show this as a chart
- Project forward, using AWS's cost projection features

### Usage

This is a wrapper around the AWS NodeJS SDK, and because of this, you need to set following environment variables to get results back:

```
AWS_ACCESS_KEY_ID='YOUR_KEY_ID'
AWS_SECRET_ACCESS_KEY='YOUR_SECRET_ACCESS_KEY'
```

Once you have this, call `greencost` to get an idea of your spend over the last year

```
npx greencost
```

```
|          | Grey   | Green  |
-----------|--------|--------|
|Aug  2018 |  40%   |  60%   |
|Sept 2018 |  40%   |  60%   |
|Oct  2018 |  40%   |  60%   |
|Nov  2018 |  40%   |  60%   |
|Dec  2018 |  40%   |  60%   |

```

### Licensing

Apache 2.0, yo.
