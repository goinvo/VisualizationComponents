[
  {
    'repeat(5)': {
      _id: '{{objectId()}}',
      index: '{{index()}}',
      organization: function() {
        // Number of items in this array must equal the number of repeats above
        var companies = ['apple', 'banana', 'strawberry', 'grape', 'peach'];
        return companies[this.index];
      },
      years: [
        {
          'repeat(3)': {
            index: '{{index()}}',
            year: function() {
              return 2018 - this.index;
            },
            months: [
              {
                'repeat(12)': {
                  index: '{{index()}}',
                  month: function() {
                    return this.index + 1;
                  },
                  monthName: function() {
                    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    return months[this.index];
                  },
                  values: [
                    {
                      'repeat(5)': {
                        index: '{{index()}}',
                        measure: function() {
                          // Number of items in this array must equal the number of repeats above
                          var measures = ['HEDIS', 'STAR', 'POOP', 'BUCHLA SYNTHS', 'SO HEADY'];
                          return measures[this.index];
                        },
                        value: '{{floating(0.15, 1.00)}}'
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  }
]
