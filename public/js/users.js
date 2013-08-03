var dt;
$(document).ready(function() {
  dt = $('table').dataTable({
      bProcessing: false
    , bServerSide: true
    , sAjaxSource: '/api/ui/users'
    , sPaginationType: 'bootstrap'
    , bDeferRender: false
    , fnDrawCallback: function() {
      hideSpinner()
      sortHeaders()
      $('[rel=tooltip]').tooltip()
    }
  })
  
  $('body').on('click', '.btn-edit', function(e) {
    var self = $(this)
      , id = self.data('id')
      , name = self.data('name')
      , role = self.data('role')
    $('.editUserModal input[name=textName]').val(name)
    $('.editUserModal select[name=selectRole]').val(role)
    $('.editUserModal').modal('show')
  })
  
  $('.editUserModal').on('hide', function() {
    $('.editUserModal input[name=textName]').val('')
  })
  
  $('.btn-save').on('click', function(e) {
    e.preventDefault()
  })
  
  $('.deleteUserModal .btn-delete').on('click', function(e) {
    
  })
  
  /*

  $('body').on('click', '.btn-stop', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/stop', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 800)
      } else {
        alertify.error('Error stopping app')
        hideSpinner()
      }
    })
    return false;
  })
  
  $('body').on('click', '.btn-install', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/install', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error installing dependencies')
        hideSpinner()
      }
    })
    return false
  })
  
  $('body').on('click', '.btn-update', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/pull', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error updating app')
        hideSpinner()
      }
    })
    return false
  })
  
  $('body').on('click', '.btn-start', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/start', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error starting app')
        hideSpinner()
      }
    })
    return false
  })
*/
})