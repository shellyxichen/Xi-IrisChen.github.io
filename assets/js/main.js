/*
	Ethereal by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

// $(document).ready(function(){

// 	const mq = window.matchMedia( "(min-width: 991px)" );

// 	$( window ).on( "load", function() {
// 	    preloaderFadeOutTime = 5000;
// 	    var preloader = $('.spinner-wrapper');
// 	    preloader.animate({
// 	      up:'40px',
// 	      opacity:0
// 	    },preloaderFadeOutTime);
// 	    preloader.css("visibility","hidden");
// 	    fadeOut(preloaderFadeOutTime);
// 	    AOS.init();
// 	  });
// });

$(document).ready(function(){

	const mq = window.matchMedia( "(min-width: 991px)" );
	var preloader;
	var preloaderShowUpTime = 2000;
	var preloaderFadeOutTime = 50;
	var flag;

	$( window ).on( "load", function() {
	    flag = 0;
	    preloader = $('.spinner-wrapper');
	    loadNow(1);
	 });

	function loadNow(opacity){
		// console.log(preloader);
		preloader.css("opacity", opacity);
		// preloader.style.opacity = opacity;
		if(opacity <= 0)
			preloader.css("visibility","hidden");
		else{
			if(flag == 0){
				window.setTimeout(function(){
					flag = 1;
					loadNow(opacity - 0.1);
				}, preloaderShowUpTime);
			}
			else{
				window.setTimeout(function(){
					loadNow(opacity - 0.1);
				}, preloaderFadeOutTime);
			}
		}
	}

});





// var loader;
// var flag = 0;

// function loadNow(opacity) {
//     if (opacity <= 0) {
//         displayContent();
//     } else {
//     	if(flag == 0)
//     		window.setTimeout(function(){
//     			flag = 1;

//     		})
//         loader.style.opacity = opacity;
//         window.setTimeout(function() {
//             loadNow(opacity - 0.9);
//         }, 2000);
//     }
// }

// function displayContent() {
//     loader.style.display = 'none';
// }

// document.addEventListener("DOMContentLoaded", function() {
//     loader = document.getElementById('loader');

//     loadNow(1);
// });