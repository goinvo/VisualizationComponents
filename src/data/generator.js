[
  {
    'repeat(5)': {
      _id: '{{objectId()}}',
      index: '{{index()}}',
      patient: function() {
        // Number of items in this array must equal the number of repeats above
        var patients = ['Veronica H.', 'Diego C.', 'Charles W.', 'Maya D.', 'Tazeen K.'];
        return patients[this.index];
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
                      'repeat(7)': {
                        index: '{{index()}}',
                        measure: function() {
                          // Number of items in this array must equal the number of repeats above
                          var measures = ['Behavior', 'Social Circumstances', 'Genetics & Biology', 'Medical Care', 'Health Literacy', 'Access', 'Environment'];
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
