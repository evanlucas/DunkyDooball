var dt;
$(document).ready(function() {
  var socket = io.connect('/')
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
  
  $('.dtbtngroup').append('<button type="button" class="btn btn-primary btn-addUser pull-right"><i class="icon-plus"></i>  Create User</button>')
  
  $('body').on('click', '.btn-addUser', function(e) {
    $('.createUserModal').modal('show')
  })
  
  $('body').on('click', '.btn-edit', function(e) {
    var self = $(this)
      , id = self.data('id')
      , name = self.data('name')
      , role = self.data('role')
    $('.editUserModal input[name=textName]').val(name)
    $('.editUserModal select[name=selectRole]').val(role)
    $('.editUserModal input[name=hiddenID]').val(id)
    $('.editUserModal').modal('show')
  })
  
  $('body').on('click', '.btn-delete', function(e) {
    var self = $(this)
      , id = self.data('id')
      , name = self.data('name')
    $('.deleteUserModal .user-name').text(name)
    $('.deleteUserModal input[name=hiddenID]').val(id)
    $('.deleteUserModal').modal('show')
  })
  
  $('.editUserModal .btn-save').on('click', function(e) {
    e.preventDefault()
    var id = $('.editUserModal input[name=hiddenID]').val()
    var role = $('.editUserModal select[name=selectRole]').val()
    socket.emit('editUser', {
        id: id
      , role: role
    })
    $('.editUserModal').modal('hide')
  })
  
  $('.editUserModal').on('hide', function() {
    $('.editUserModal input[name=textName]').val('')
    $('.editUserModal input[name=hiddenID]').val('')
    $('.editUserModal select[name=selectRole]').val('User')
  })

  
  $('.createUserModal .btn-save').on('click', function(e) {
    e.preventDefault()
    var name = $('.createUserModal input[name=textName]')
    if (name.val() === "") {
      name.closest('.control-group').addClass('error')
      return false
    } else {
      name.closest('.control-group').removeClass('error')
    }
    var email = $('.createUserModal input[name=textEmail]')
    if (email.val() === "") {
      email.closest('.control-group').addClass('error')
      return false
    } else {
      email.closest('.control-group').removeClass('error')
    }
    var role = $('.createUserModal select[name=selectRole]')
    socket.emit('createUser', {
        name: name.val()
      , email: email.val()
      , role: role.val()
    })
    $('.createUserModal').modal('hide')
  })
  
  $('.createUserModal').on('hide', function() {
    $('.createUserModal input[name=textName]').val('')
    $('.createUserModal input[name=textEmail]').val('')
    $('.createUserModal select[name=selectRole]').val('User')
  })
  
  $('.deleteUserModal .btn-delete').on('click', function(e) {
    var id = $('.deleteUserModal input[name=hiddenID]').val()
    socket.emit('deleteUser', {
      id: id
    })
    $('.deleteUserModal').modal('hide')
  })
  
  $('.deleteUserModal').on('hide', function() {
    $('.deleteUserModal .span-name').text('')
    $('.deleteUserModal input[name=hiddenID]').val('')
  })
  /**
   * Socket handlers
   */
  
  socket.on('createUserError', function(msg) {
    alertify.error(msg)
  })
  
  socket.on('createUserSuccess', function(msg) {
    alertify.success(msg)
    dt.fnDraw()
  })
  
  socket.on('editUserError', function(msg) {
    alertify.error(msg)
  })
  
  socket.on('editUserSuccess', function(msg) {
    alertify.success(msg)
    dt.fnDraw()
  })
  
  socket.on('deleteUserError', function(msg) {
    alertify.error(msg)
  })
  
  socket.on('deleteUserSuccess', function(msg) {
    alertify.success(msg)
    dt.fnDraw()
  })
})