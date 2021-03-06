$('.datepicker').datepicker({
    ok: '',
    clear: 'Clear selection',
    close: 'Cancel'
    })
  $(".phone2").mask("+7 (999) 99-99-999");
  $('.js-form-validate').submit(function () {
  var form = $(this);
  var field = [];
  form.find('input[data-validate]').each(function () {
    field.push('input[data-validate]');
    var value = $(this).val(),
        line = $(this).closest('.some-form__line');
    for(var i=0;i<field.length;i++) {
      if( !value ) {
        line.addClass('some-form__line-required');
        setTimeout(function() {
          line.removeClass('some-form__line-required')
        }.bind(this),2000);
        event.preventDefault();
      }
    }
  });
});