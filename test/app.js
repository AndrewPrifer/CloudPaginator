$("#form").submit(function(event) {
  event.preventDefault();
  var form = new FormData($(this)[0]);
  $.ajax({
    url: 'http://localhost:3000/reader',
    method: "POST",
    data: form,
    processData: false,
    contentType: false,
  }).done((result) => {
    var iframe = $('#frame')[0];
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(result);
    iframe.contentWindow.document.close();
  }).fail((error) => {
    console.log(error);
  });
});
