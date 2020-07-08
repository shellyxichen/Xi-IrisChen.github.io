$(function(){
    var win_w = $(window).width();
    var current_top = 0;
    var nav_num = $('.menu-ul > li').not('.font_padding').length;
    var toggleSelect = function(w){
        if(w<=240){$(".sub").removeClass("select");}
        for(var i = 0; i < nav_num; i++){
            if(($(".bT").eq(i).offset().top - 50)<w){
                $(".sub").removeClass("select");
                $(".pT").eq(i).addClass("select");
            }
        }
    }

    $('.sub').click(function(){
    	$(this).addClass('select');
        $(this).parent().siblings().children().removeClass('select');
    });

    $('.font_padding').click(function(){
    	$(this).addClass('b_select');
        $(this).siblings('.font_padding').removeClass('b_select');
        setTimeout(()=> $(".sub").removeClass("select"),10);
    });

    $( window ).on( "load", function() {
        // console.log("load");
        $('.float-nav').addClass('float-nav-hide');
    });

    $(window).on('scroll',function(e){
        var whs = $(window).scrollTop();
        if(win_w>415){
            // if ($('.project-narrow-content').offset().top - whs < 0){
            //     $(".project-aside").addClass('project-aside-float');
            // } else {
            //     $(".project-aside").removeClass('project-aside-float');
            // }
            // if($('.top-nav').css('opacity')>0 || whs < 200){
            //     $('.top-nav').css('opacity',(60-whs)/60);
            //     $('.top-nav').show();
            // }else{$('.top-nav').hide();}
        }
        toggleSelect(whs);

        if( whs >= current_top ){ //scroll down
            if (!$('.float-nav').hasClass('float-nav-hide')) {
                $('.float-nav').addClass('float-nav-hide');
            }
            current_top = whs;
        }else{ //scroll up
            if ($('.float-nav').hasClass('float-nav-hide')) {
                // console.log("scroll up");
                $('.float-nav').removeClass('float-nav-hide');
            }
            current_top = whs;
        }
    });
    $('.project-nav-toggle').on('click',function(e){
        $('.project-nav-toggle').toggleClass('project-nav-toggle-n');
        $('.project-aside').toggleClass('project-aside-show');
    });

    $('.top-img').height($(window).height());
    $('.float-nav').html($('.top-nav').html());

    //about me project area hover
    $('.hover-link').mouseover(function() {
        console.log($(this).text());
        $('.hover-img').show().attr('src', 'assets/img/about me/' + $(this).text() + '.png')
    }).mouseout(function(){
        $('.hover-img').attr('src', 'assets/img/about me/none.png').hide()
    });
});