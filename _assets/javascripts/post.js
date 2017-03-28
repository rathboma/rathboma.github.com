
$(document).ready(function(){

  var _gaq = _gaq || [];
  _gaq.push(['_setPageGroup', 1, 'Blog Post']);


  $('.show-comments').on('click', function(){
        var disqus_shortname = 'rathboma'; // Replace this value with *your* username.
        var disqus_identifier = '{{page.id}}';
        var disqus_title = "{{page.title | escape_javascript}}";
        var disqus_url = '{{site.url}}{{page.url}}';

        // ajax request to load the disqus javascript
        $.ajax({
                type: "GET",
                url: "http://" + disqus_shortname + ".disqus.com/embed.js",
                dataType: "script",
                cache: true
        });
        // hide the button once comments load
        $(this).fadeOut();
  });


  var modal = "#cheatsheetModal";

  // MODAL STUFF
    var validSubject = window.showModal;
    var modalShownCookie = $.cookie("modalshown");
    var modalShown = false;
    if (modalShownCookie != undefined && modalShownCookie == 'true') {
      console.log("modalshown cookie is TRUE!");
      modalShown = true;
    }
    function isScrolledIntoView(elem) {
        if($(elem).length == 0) {
          return false;
        }
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

    $(window).on('scroll', function(e) {
      if(isScrolledIntoView($('#modal-trigger')) && modalShown == false && validSubject) {
        modalShown = true;
        $.cookie('modalshown', 'true', {expires: 1, path: '/'});
        $(modal).modal();
      }
    });
    $("#closemodal").click(function(){
      $(modal).modal('hide');
    });
});
