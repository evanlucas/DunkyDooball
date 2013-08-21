$(document).ready(function() {
  var socket = io.connect('/')
    , ramChart
  
  ramChart = $('.memory .percentage').easyPieChart({
      animate: 500
    , scaleColor: false
    , lineCap: 'butt'
    , lineWidth: 10
    , barColor: function(percent) {
      percent /= 100
      return "rgb("+Math.round(255 * (1-percent))+", "+Math.round(255 * (percent)) + ", 0)";
    }
    , onStep: function(value) {
      this.$el.find('span').text(~~value)
    }
  })
  
  $(function grabData() {
    socket.emit('grabData')
    setTimeout(function() {
      grabData()
    }, 3000)
  })
  
  socket.on('grabDataSuccess', function(data) {
    var memP = (data.freemem / data.totalmem) * 100
    ramChart.data('easyPieChart').update(memP)
    $('span.freemem').text(data.freemem+' MB')
    $('span.totalmem').text(data.totalmem+' MB')
    var loadavg = data.loadavg
    var cpuCount = data.cpuCount
    if (loadavg > cpuCount) {
      $('.loadavg')
        .closest('.sect')
        .find('i')
        .removeClass('text-success')
        .removeClass('text-warning')
        .addClass('text-danger')
    } else if (loadavg / 2 > cpuCount) {
      $('.loadavg')
        .closest('.sect')
        .find('i')
        .removeClass('text-danger')
        .removeClass('text-success')
        .addClass('text-warning')
    } else {
      $('.loadavg')
        .closest('.sect')
        .find('i')
        .removeClass('text-warning')
        .removeClass('text-danger')
        .addClass('text-success')
    }
    $('.loadavg').text(loadavg)
  })
})