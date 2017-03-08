

  var showPanel = function(){
    var submitted = $.cookie("hola-bar-submitted");
    var closed = $.cookie("hola-bar-closed");
    var mobile = $(window).width() < 620;
    if(submitted || closed || mobile) {
      return;
    }

    $('#hola-bar').slideDown("slow");
    $('body').animate({"margin-top": "50px"}, "slow");
  };


  var dismiss = function() {
    $('#hola-bar').slideUp("slow");
    $('body').animate({"margin-top": "0px"}, "slow")
  }





  $(document).ready(function(){

    $("#hola-bar-close-button").click(function(event){
      event.preventDefault();
      $.cookie("hola-bar-closed", "true", {path: '/'});
      dismiss();
    })

    $("#hola-bar-form").submit(function(event){
      $.cookie("hola-bar-submitted", "true", { expires: 7, path: '/'});
      dismiss();
    })

    setTimeout(showPanel, 3000);
  })
