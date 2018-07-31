/*!
*	(C)2009-2014 VeryIDE
*	http://www.veryide.com/
*	Scene 图片预览工具
*	$Id: scene.js 2014/06/13 Lay $
*/

/**
 * @name Scene
 * @class 图片全屏预览工具，支持多图切换与缩放显示
 * @author Lay
 * @version 1.1
 * @see http://www.veryide.com/projects/scene/
 * @constructor
 */
var Scene = {
	
	//容器对象
	pack : null,
	
	//初始缩放值
	size : 10,
	
	//图片清单
	list : null,
	
	//当前页码
	task : null,
	
	//触控点
	point : {},
	
	//元素
	child : {},

	/**
	* @desc  获取ID对象
	* @param {String} obj 元素 ID
	* @return {Object} 元素对象
	* @example
	* Magic.$('fileobj');
	*/
	$ : function( obj ){
		return document.getElementById( obj );	
	},
	
	/**
	* @desc  当前时间戳
	* @return {Number} 时间戳
	* @example
	* Magic.time();
	*/
	time : function(){
		return new Date().getTime();	
	},
	
	//绑定事件
	addEvent : function ( obj, type, fn, cap){
		var cap = cap || false;
		if(obj.addEventListener){
			obj.addEventListener(type, fn, cap)
		}else{
			obj.attachEvent("on"+type, fn)
		}
	},
	
	//解绑事件
	removeEvent : function( obj, type, fn, cap){
		var cap = cap || false;
		if(obj.removeEventListener){
			obj.removeEventListener(type, fn, cap);
		}else{
			obj.detachEvent("on"+type, fn)
		} 
	},
		
	/*
		获取当前视口信息
	*/
	getBody : function () {
		return {width:document.body.clientWidth, height:document.body.clientHeight};
	},
	
	/*
		获取某个子元素
	*/
	getChild : function( selector ){
		if( selector.indexOf('.') == 0 ){
			return Scene.pack.getElementsByClassName( selector.substring(1) )[0]
		}else{
			return Scene.pack.getElementsByTagName( selector )[0];
		}
	},
	
	//初始化方法
	init : function( context ){
		
		//创建看图组件
		Scene.pack = document.createElement('div');
		Scene.pack.id = 'scene';
		Scene.pack.innerHTML = ''+
					'<div class="control">'+
						'<string class="zoom"></string>'+
						'<string class="exit">x</string>'+
					'</div>'+
					'<div class="handle">'+
						'<string class="page"></string>'+
						'<strong class="prev">&#139;</strong>'+
						'<strong class="next">&#155;</strong>'+
					'</div>'+
					'<div class="background">'+
						'<div class="frame"><img /></div>'+
					'</div>';
		
		//加入到 DOM
		document.body.appendChild( Scene.pack );
		
		Scene.child.place = Scene.getChild('img');
		Scene.child.zoom = Scene.getChild('.zoom');
		Scene.child.page = Scene.getChild('.page');
		Scene.child.exit = Scene.getChild('.exit');
		
		//////////////
		
		//元素上下文
		var root = context || document;
		
		//获取全部图片
		Scene.list = root.getElementsByTagName('img');
		
		//对图片进行事件绑定
		for( var i=0; i < Scene.list.length; i++ ){
			
			//自动对图片进行索引编号，用于分页显示
			var self = Scene.list[i];
				self.setAttribute( 'data-index', i );
			
			//绑定点击事件
			self.onclick = (function( file ){
				return function( e ){
					Scene.show( this, e );
				}
			})( self );
		}
		
		//////////////
		
		//多图片，可分页模式
		if( Scene.list.length > 1 ){
			
			//分页控件
			var handle = Scene.getChild('.handle');
			
			//鼠标滑入时显示控件
			Scene.addEvent( Scene.pack, 'mouseover', function( e ) {
				handle.style.visibility = 'visible';
			}, false);				
			
			//鼠标滑出时隐藏控件
			Scene.addEvent( Scene.pack, 'mouseout', function( e ) {
				handle.style.visibility = 'hidden';
			}, false);
			
			//////////////
			
			//上一页
			var prev = Scene.getChild('.prev');
			Scene.addEvent( prev, 'click', function( e ) {
				
				if( Scene.task == 0 ){
					Scene.page( Scene.list.length - 1, e );
				}else{
					Scene.page( Scene.task - 1, e );
				}
				
			}, false);
			
			//下一页
			var next = Scene.getChild('.next');
			Scene.addEvent( next, 'click', function( e ) {
				
				if( Scene.task + 1 > Scene.list.length - 1 ){
					Scene.page( 0, e );
				}else{
					Scene.page( Scene.task + 1, e );
				}
				
			}, false);
				
		}
		
		//////////////
		
		//点击图片外围，退出图片查看
		Scene.addEvent( Scene.pack, 'click', function( e ) {
			Scene.exit( this, e );
		}, false);
			
		//绑定图片点击，自动循环翻页
		Scene.addEvent( Scene.child.place, 'click', function( e ) {
			
			if( Scene.list.length <= 1 ) return;
			
			if( Scene.task + 1 > Scene.list.length - 1 ){
				Scene.page( 0, e );
			}else{
				Scene.page( Scene.task + 1, e );
			}
				
		}, false);
		
					
		//绑定退出事件
		Scene.addEvent( Scene.child.exit, 'click', function( e ) {
			Scene.exit( this, e );
		}, false);
		
		//////////////
		
		//绑定窗口缩放
		Scene.addEvent( window, 'resize', function( e ) {
			
			if( Scene.pack.className != 'show' ) return;
			
			//对图片容器进行缩放处理
			Scene.zoom( e );
				
		}, false);
			
		//绑定鼠标滚动
		Scene.addEvent( document.body, 'mousewheel', function( e ) {
			
			if( Scene.pack.className != 'show' ) return;
			
			//鼠标向上滚动时放大，向下滑动时缩小
			if ( e.wheelDelta >= 120){
				Scene.size ++;
			}else if ( e.wheelDelta <= -120 && Scene.size > 1 ){
				Scene.size --;
			}
			
			//对图片容器进行缩放处理
			Scene.zoom( e );
				
		}, false);
			
		//绑定页面触摸
		/*
		Scene.addEvent( document.body, 'touchstart', function( e ) {
			
			if( Scene.pack.className != 'show' ) return;
			
			//获取第一个触点
			var touch = e.targetTouches[0];
			  
			//记录触点初始位置  
			Scene.point.x = touch.pageX;
			Scene.point.y = touch.pageY;
				
		}, false);
			
		//绑定页面触摸
		Scene.addEvent( document.body, 'touchend', function( e ) {
			
			if( Scene.pack.className != 'show' ) return;
			
			//获取第一个触点
			var touch = e.changedTouches[0];
			
			//左右滑动
			var x = touch.pageX - Scene.point.x;
			if( x != 0 ) {
				if( x > 30 ){
					Scene.$('debug').innerHTML = '向右滑动';
					Scene.page( Scene.task + 1, e );
				}else if( y < -30 ){
					Scene.$('debug').innerHTML = '向左滑动';
					Scene.page( Scene.task - 1, e );
				}
			}  
			
			//上下滑动
			var y = touch.pageY - Scene.point.y;
			if ( y != 0 ) {
				console.log( y );
				if( y > 30 ){
					Scene.size --;
					Scene.$('debug').innerHTML = '向下滑动';
				}else if( y < -30 ){
					Scene.size ++;
					Scene.$('debug').innerHTML = '向上滑动';
				}
				
				//对图片容器进行缩放处理
				Scene.zoom( e );	
			}   
				
		}, false);
		*/

		
	},
	
	/*
		处理分页显示
		index	第几张
		e		事件对象
	*/
	page : function( index, e ){
		
		//清除定时执行方法，防止重复执行
		Scene.init && window.clearTimeout( Scene.init );
		
		if( index >= 0 && index <= Scene.list.length -1 ){
			
			//显示某张图片
			Scene.show( Scene.list[ index ], e );				
			
			//显示分页页码
			Scene.child.page.innerHTML = ( index + 1 ) + '/' + Scene.list.length;					
			Scene.child.page.style.visibility = 'visible';
			
			//初始化缩放
			Scene.size = 10;
			
			//对图片容器进行缩放处理
			Scene.zoom( e );
			
			//定时隐藏页码文字
			Scene.init = window.setTimeout(function(){
				Scene.child.page.style.visibility = 'hidden';	
			}, 2000);				
			
		}
	
	},
	
	/*
		全屏显示图片
		image	图片对象
		e		事件对象
	*/
	show : function( image, e ){
		
		//显示看图组件
		Scene.pack.className = 'show';
		
		//当前任务索引
		Scene.task = parseInt( image.getAttribute( 'data-index' ) );
		
		//存储图片对象
		Scene.child.image = image;
		
		//填充图片容器
		Scene.child.place.src = image.src;
			//place.style.zoom = Scene.size + '0%';				
		
		//////////////
		
		//根据原图尺寸，对齐图片容器
		Scene.align( 'natural' );			
		
	},
	
	//缩放图片大小
	zoom : function( e ){
		
		//消除默认事件
		e.preventDefault();
		
		//元素对象
		var image = Scene.child.image;
		var place = Scene.child.place;
		
		//显示缩放文字框
		Scene.child.zoom.style.visibility = 'visible';
		
		//清除定时执行方法，防止重复执行
		Scene.init && window.clearTimeout( Scene.init );
		
		//对图片进行缩放处理
		//image.style.zoom = Scene.size + '0%';
		Scene.child.zoom.innerHTML = Scene.size + '0%';
		
		//根据缩放尺寸，对齐图片容器
		Scene.align( 'offset' );
							
		//图片放大20倍时，显示退出按钮
		if( Scene.size >= 20 ){
			Scene.child.exit.style.visibility = 'visible';
		}else{
			Scene.child.exit.style.visibility = 'hidden';
		}
		
		//定时隐藏缩放比例文字
		Scene.init = window.setTimeout(function(){
			Scene.child.zoom.style.visibility = 'hidden';	
		}, 2000);
		
	},
	
	//居中图片对象
	align : function( type ){
		
		//视口尺寸
		var port = Scene.getBody();
		
		//元素对象
		var image = Scene.child.image;
		var place = Scene.child.place; 
		
		//原图尺寸
		switch( type ){
			case 'natural':
			
				//当前原图尺寸
				var size = { width : image.naturalWidth, height : image.naturalHeight };
				
				//当前原图比例
				var scale = size.width / size.height;
				
				//console.log( size, port );
				
				//图片大于视口宽时，自动对图片进行缩小显示
				if( size.width > port.width ){
					size.width = port.width * 0.9;
					size.height = size.width / scale;
				}
					
				//图片大于视口高时，自动对图片进行缩小显示
				if( size.height > port.height ){
					size.height = port.height * 0.9;
					size.width = size.height * scale;
				}
				
				//console.log( size );
				
			break;
			
			case 'offset':
			
				//当前缩放尺寸
				var size = { width : image.width * Scene.size / 10, height : image.height * Scene.size / 10 };
				
			break;	
		}
			
		//计算左边、上边修正尺寸
		size.x = port.width - size.width;
		size.y = port.height - size.height;
		
		//更新图片尺寸
		place.style.width = size.width + 'px';
		place.style.height = size.height + 'px';
		
		//console.log( port, size );
		
		//修正图片容器位置
		Scene.child.frame = Scene.getChild('.frame');
		Scene.child.frame.style.top = ( size.y / 2 ) + 'px';		   
		Scene.child.frame.style.left = ( size.x / 2 ) + 'px';		   
		
		//修正分页控件位置
		//var handle = Scene.getChild('.handle');
		//	handle.style.top = ( ( port.height - handle.offsetHeight ) / 2 ) + 'px';		   
		
	},
	
	//退出全屏预览
	exit : function( pack, e ){
		
		//消除默认事件
		e.preventDefault();
		
		//退出图片预览，并重置缩放比例
		if( e.target && /(background|exit)/.test( e.target.className )  ){
			Scene.pack.className = 'hide';
			Scene.size = 10;
		}
		
	}
	
}
