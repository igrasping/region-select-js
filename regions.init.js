/* 中国县级及以上行政区域联动 */
(function(nameSpace) {
	eval('nameSpace = window.' +nameSpace+ ' = {NS:"' +nameSpace+ '"};');
	nameSpace.E=function() {		
		if (window.console && window.console.log) {
			if ('object' == typeof arguments) {
				for (var fi = 0; fi < arguments.length; fi++) {//ie的不支持
					console.log('window.' +nameSpace.NS+ '出错',arguments[fi]);
				}
			} else {
				console.log('window.' +nameSpace.NS+ '出错',arguments);
			}
		}
	};
	nameSpace.load=function(func){//行政数据异步加载,所以,需要立刻回调,请使用本方法 前缀.load(function(){过程});
		//ie会把整个js处理完成才处理下个script块
		if ('object' == typeof nameSpace.regions) {
			return func();
		}
		
		('object' != typeof nameSpace.loadFuns) && (nameSpace.loadFuns = []);
		nameSpace.loadFuns[nameSpace.loadFuns.length] = func;
	};
	nameSpace.css = function(css){
		var style = document.createElement('STYLE');
		style.type="text/css";
		if (style.styleSheet) {//ie6
			style.styleSheet.cssText = css;
		} else {
			style.innerHTML = css;
		}
		
		var head = document.getElementsByTagName('HEAD');
		if (!head) return nameSpace.E('找不到head标签');
		head = head.length ? head[0] : head;
		head.appendChild(style);
	};
	nameSpace.toSortCode = function (obj){//对原始结构排序,并返回sort后的代码
		if ('function' != typeof String.localeCompare) return '浏览器不支持中文排序,请更换浏览器再尝试';
		var sortFun = function(a, b){
			if ('object' == typeof a) a = a[0];
			if ('object' == typeof b) b = b[0];
			return a.localeCompare(b);
		};	
		var cls = function(str) {return str.replace(/"/g, '\\"').replace(/[\n\r]/g, '');};
		var fo = function (ob, tab) {
			if ('string' != typeof tab) tab = '';
			var code = [];
			var o = ob.sort(sortFun);
			
			for (var fi = 0; fi < o.length; fi++) {
				var v = o[fi];
				
				if ('string' == typeof v) {//无子区域
					code[code.length] = tab+ '"' +cls(v)+ '"';
				} else if ('object' == typeof v){//有子区域
				
					code[code.length] = tab+ '["' +cls(v[0])+ '", [\n'
										+fo(v[1], tab+'\t')
										+'\n' +tab+ ']]';
				} else {
					nameSpace.E('此区域对象值有误,可能是数组开始或结尾多写,号,如[,1,2,]写法', ob);
				}
			}
			
			return code.join(',\n');
		};
		return '[\n' +fo('object' == typeof obj ? obj : namSpace.regions, '\t')+ '\n]';
	};
	nameSpace.toSQL = function(){//格式化成sql格式
	};
	nameSpace.toSelect = function (box /* 绑定下拉的html对象,不能是id值 */, changeFuc /* 下拉变化后回调,function(path){console.log(path);} */, defVals /*初始值 = '中国/北京市/海淀区/中关村/.../区域N' 或 null */, path /* 路径,如 [32][1] 是中国区域 或 null,用于只列举某区域,必须传入[],否则默认使用全部*/) {//格式成下拉对象,改变区域时,会从顶级作为参数传递
		if (!defVals || /^\s*$/.test(defVals)) defVals = '';
		var thisFuc = 'toSelect';
		var ID = function(id) {return document.getElementById(id);};
		if ('object' != typeof box || !box.tagName) return nameSpace.E('请把' +thisFuc+ '的 box变量 指向一个html对象');
		if (!nameSpace.toSelectI) nameSpace.toSelectI = 0;
		var idPre = 'regionTS' + nameSpace.toSelectI++;
		var maxHeight = 300;//下拉的高度
		var ahcn = 'h';//选择区域高亮类
		var clsPre = 'span.regionHolder ';
		nameSpace.toSelectI < 2 && nameSpace.css(//只需要样式一次
			clsPre+ '{white-space: nowrap;position:relative;padding:5px;border:0px solid black;font-size:12px;}\n'
			+ clsPre+ ' a{text-decoration:none;}\n'
			+ clsPre+ '.regionSelBox{top:0px;left:0px;z-index:99;white-space: nowrap;position: absolute;overflow-x:visible;overflow-y:auto;height:' +maxHeight+ 'px;border:1px solid lightgray;background-color:white;padding:5px;display:none;}\n'
			+ clsPre+ '.regionSelBox a{display:block;white-space: nowrap;color:black;font-size:24px;line-height:24px;margin:0px;padding:0px;border:0px none;}\n'
			+ clsPre+ '.regionSelBox a span.regionName{margin-left:10px;font-size:12px;line-height:12px;}\n'
			+ clsPre+ '.regionSelBox a:hover{color:blue;}\n'
			+ clsPre+ '.regionSelBox a.' +ahcn+ ' span.regionName{padding:1px 5px;border-color:gray;border-style:solid;border-width:1px 2px;background-color:;}\n'
			+ clsPre+ '.regionSelBox div.regionSub{display:none;}\n'
			+ clsPre+ ' a.regionPath{}\n'
			+ clsPre+ ' a.regionPath:hover{color:lightgray;}\n'
			+ clsPre+ ' span.regionGLine{color:lightgray;}\n'
			+ clsPre+ ' span.regionDot{color:gray;}\n'
			+ clsPre+ ' span.regionHide{visibility: hidden;}\n'
			+ clsPre+ ' span.regionArrow{font-weight:bold;margin-left:5px;}\n'
			+ clsPre+ ' span.regionTxtBlank{margin-right:10px;}\n'//补充regionName空闲
		);		
		box.innerHTML = ''
			+'<span class="regionHolder" id="' +idPre+ 'Holder">'
			+ '<div id="' +idPre+ 'Selecter" class="regionSelBox"></div>'
			+ '<a href="javascript:;" id="' +idPre+ 'Path" class="regionPath" title="点击弹出地区选择下拉框,移走鼠标会自动隐藏"><span id="' +idPre+ 'PathName" >请选择地区</span><span class="regionArrow" id="' +idPre+ 'Arrow">&darr;</span></a>'
			+ '</span>';
		if ('function' != typeof changeFuc) return nameSpace.E('请把' +thisFuc+ '的 changeFuc 变量设置为function对象');
		try {
			if (path && path.indexOf('[') > -1) {
				eval('path = nameSpace.regions' +path);//保持结构
			} else {
				path = nameSpace.regions;
			}
		} catch (e) {nameSpace.E(thisFuc+ '的path变量值有误,被忽略', e)}
		
		if ('object' != typeof path) {
			path = nameSpace.regions;
			nameSpace.E(thisFuc+ '的path变量值有误,重置成全部');
		}
		
		if (defVals.length) defVals = '/' +defVals+ '/';
		var spreadId = '';//上个展开路径
		var defValsPath = '/';
		var mkList = function(lp, linePre, level, idPath){
			if ('number' != typeof level) level = 0;
			if ('string' != typeof linePre) linePre = '';
			if ('string' != typeof idPath) idPath = idPre+ 'A';
			if ('.object.string.'.indexOf('.' +(typeof lp) + '.') < 0) return '';
			var lh = '';
			
			for (var fi = 0; fi < lp.length; fi++) {
				var v = lp[fi];
				var j = '<span class="regionDot">' +('' == linePre + lh ? '┏' /*没上层*/ :'┣') + '</span>';//树叉
				var p = '<span class="regionGLine">┃</span>';//同级树叉虚线,不能用┇,在ie下面认为是半角符号
				var idP = idPath +'_'+ fi;
				
				if (1 == lp.length) {//只有一个
					j = p = '';
				} else if (fi + 1 >= lp.length) {//最后一组
					j = '<span class="regionDot">┗</span>';
					p = '<span class="regionHide">┃</span>';//末行左边右移1┗(全角)
				}
				
				var asc = '';//选择中的样式
				var sub = '';
				var rn = v;//区域名
				
				if ([].constructor == v.constructor) {//有子级					
					sub = mkList(v[1], linePre+'<span class="regionTxtBlank">' +p+ '</span>', level+1, idPath+'_'+fi);
					rn = v[0];
				} else if ('string' != typeof v) {//不支持格式
					nameSpace.E('出错,不明的区域值', v);
					continue;
				} else { //字符串
				}
				
				
				if (defVals.indexOf(defValsPath +rn+ '/') == 0) {
					defValsPath += rn+'/';
					asc = ahcn;						
					spreadId = idP;
				}
					
				lh += '<a href="javascript:;" target="_self" name="' +idPre+ 'SubAS" id="' +idP+ '" class="' +asc+ '" value="' +rn+ '" title="' +rn+ '">' +linePre+j+ '<span class="regionName">' +rn+ '</span></a>';
				
				if (sub.length) {
					lh += '<div class="regionSub" id="' +idP+ 's" style="' +(asc.length ? 'display:block;': '')+ '">' +sub+ '</div>';
				}
			}
			
			return lh;
		};
		var addClass = function(id, c) {
			var cn = ID(id).className;
			ID(id).className = !cn ? c : ((' ' +cn+ ' ').replace(new RegExp(' ' +c+ ' ', 'g'), '') + ' ' +c).replace(/^\s+|\s+$/, '');
		};
		var delClass = function(id, c) {
			var cn = ID(id).className;
			if (!cn) return;
			ID(id).className = (' ' +cn+ ' ').replace(new RegExp(' ' +c+ ' ', 'g'), '').replace(/^\s+|\s+$/, '');
		};
		ID(idPre+ 'Selecter').innerHTML = mkList(path);
		defValsPath = defValsPath.replace(/^\/|\/$/g, '');//不能使用默认值,可能路径有误
		
		if (defVals && defValsPath.length) {//有默认值,也触发改变事件			
			ID(idPre+ 'PathName').innerHTML = defValsPath;
			changeFuc(defValsPath.split('/'));
		}
		var pathHeight = 0;
		ID(idPre+ 'Path').onclick = function(){
			//有可能被放到父结构是display:none;结构中,所以,只能在显示时再获取内容高度
			if (!pathHeight) {//只取一次,防止显示后还再,高度就有误
				pathHeight = ID(idPre+ 'Holder').offsetHeight - 2;
				ID(idPre+ 'Selecter').style.top = pathHeight + 'px';
			}
			
			clearTimeout(out2hide);
			ID(idPre+ 'Selecter').style.display = 'block';
			ID(idPre+ 'Arrow').innerHTML = '&uarr;';
		};
		var out2hide;
		ID(idPre+ 'Holder').onmouseover = function(){
			clearTimeout(out2hide);
		}
		ID(idPre+ 'Holder').onmouseout = function(){
			clearTimeout(out2hide);
			out2hide = setTimeout(function(){
				ID(idPre+ 'Arrow').innerHTML = '&darr;';
				ID(idPre+ 'Selecter').style.display = 'none';
			}, 100);
		};
		var regionSubA = document.getElementsByName(idPre+ 'SubAS');
		
		for (var fi = 0; fi < regionSubA.length; fi++) {
			if (!regionSubA[fi].tagName) continue;
			regionSubA[fi].onclick = function() {//点击
				var id = this.id;
				addClass(id, ahcn);//高亮
				var s = ID(id+'s');
				var clkPath = [];
				var clkIds = id.split('_');
				var clkId = clkIds[0];

				for (var fi = 1 /* 0为前缀 */; fi < clkIds.length; fi++) {//取出完整路径
					clkId += '_' +clkIds[fi];
					clkPath[clkPath.length] = ID(clkId).getAttribute('value');
				};
				
				ID(idPre+ 'PathName').innerHTML = clkPath.join('/');
				changeFuc(clkPath);//触发改变事件
				
				if (s) {//有下级
					s.style.display = 'block';
				}
				
				//收起其它路径
				if (spreadId.length) {
					var cutId = spreadId;
					
					while(cutId.indexOf('_') > -1 && id.indexOf(cutId) < 0) {//收缩直到与当前的重合
						if (ID(cutId+'s')) {
							ID(cutId+'s').style.display = 'none';
						}
						
						delClass(cutId, ahcn);//移除高亮
						cutId = cutId.replace(/_\d+$/, '');//截掉终级id
					};
				}
				
				spreadId = id;//记住新id
			};
		}
	};	
	
	
	//--------------
	nameSpace._init = function(_regions_){//数据加载完成.开始执行
		nameSpace.regions = _regions_;
		if ('object' != typeof nameSpace.loadFuns || !nameSpace.loadFuns.length) return;//ie加载顺序不同
		for (var fi =0; fi<nameSpace.loadFuns.length;fi++)
			'function' == typeof nameSpace.loadFuns[fi] && nameSpace.loadFuns[fi]();
	};
	if (!document.body) return nameSpace.E('未找到document.body请把本js移动到<body>标签之后载入');
	if ('complete' == window.document.readyState) return nameSpace.E('本js不允许在onload后加载,因为会导致获取本身src失败的方法失效');
	//自动获取本身src的方法不能在onload后,否则在ff中会失败
	var js = document.getElementsByTagName('SCRIPT');	
	if (!js || !js.length) return nameSpace.E('兼容问题,无法获取js自身src');
	js = js[js.length -1];
	var src = js.src;
	if (!src) return nameSpace.E('取不到js的src属性');
	var jsDir = src.replace(/[^\/]+\.js([#\?].*)?$/, '');
	//加载行政数据js
	var js = document.createElement('SCRIPT');
	js.src = jsDir+ 'regions.js';
	js.id = 'regionsJsScript';
	js.setAttribute('load4init', nameSpace.NS+ '._init');
	document.body.appendChild(js);
})('regions');