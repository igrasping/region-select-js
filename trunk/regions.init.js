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
	nameSpace.load=function(func){//行政数据异步加载,所以,需要立刻回调,请使用本方法,如 前缀.load(function(){前缀.toSelect();});
		//ie会把整个js处理完成才处理下个script块
		if ('object' == typeof nameSpace.regions) return func();		
		('object' != typeof nameSpace.loadFuns) && (nameSpace.loadFuns = []);
		nameSpace.loadFuns[nameSpace.loadFuns.length] = func;
	};
	nameSpace.css = function(cssTxt){//写入css代码块
		var style = document.createElement('STYLE');
		style.type="text/css";		
		if (style.styleSheet)  style.styleSheet.cssText = cssTxt;//ie6
			else style.innerHTML = cssTxt;		
		var head = document.getElementsByTagName('HEAD');
		if (!head) return nameSpace.E('写入css代码块失败,找不到head标签');
		head = head.length ? head[0] : head;
		head.appendChild(style);
	};
	nameSpace.toSortCode = function (obj /*按本js需要格式好的数组,即意义在于不需要人工排序,写好结构后,使用本方法排序再替换掉数据*/){//对原始结构排序,并返回sort后的代码
		if ('function' != typeof String.localeCompare) return '浏览器不支持中文排序,请更换浏览器再尝试';
		var sortFun = function(a, b){
			if ('object' == typeof a) a = a[0];
			if ('object' == typeof b) b = b[0];
			return a.localeCompare(b);//使用浏览器本地化的多字节字符排序
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
	nameSpace.toSQL = function(regionObj){//格式化成sql格式
	};
	nameSpace.toSelect = function (
		box /* 绑定下拉的html对象,或是id字符串值 */
		, changeFuc /* 下拉变化后回调,function(path){console.log(path);} */
		, initRegions /*初始值 = '中国/北京市/海淀区/中关村/.../区域N' 或 null, 只显示从头匹配部分,后面不匹配的将弃用*/
		, path /* 路径,如 [32][1] 是中国区域,即数据 变量名[32][1]意思 或 null,用于只列举某区域,必须传入[],否则默认使用全部, 关于路径,请看数据结构*/
		, maxLevel /* 显示path 后的级数,如2,中国->省;3,中国->省->市 */
	) {//在页面html对象绑定行政区域选择下拉对象,改变区域时会触发事件,同页面支持无限个实例
		if (!initRegions || /^\s*$/.test(initRegions)) initRegions = '';
		if ('number' != typeof maxLevel || maxLevel < 1) maxLevel = 0;//不需要规定级
		var thisFuc = 'toSelect';
		var ID = function(id) {return document.getElementById(id);};
		'string' == typeof box && (box = ID(box));
		if ('object' != typeof box || !box.tagName) return nameSpace.E('请把' +thisFuc+ '的 box变量 指向一个html对象(或是它的ID字符串)');
		if (!nameSpace.toSelectI) nameSpace.toSelectI = 0;
		var idPre = 'regionTS' + nameSpace.toSelectI++;
		var maxHeight = 300;//下拉的高度
		var ahcn = 'regionHL';//选择区域高亮类
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
			+ clsPre+ ' span.regionBlank{visibility: hidden;}\n'
			+ clsPre+ ' span.regionArrow{font-weight:bold;margin-left:5px;}\n'
			+ clsPre+ ' span.regionTxtBlank{margin-right:10px;}\n'//补充regionName空闲
		);		
		box.innerHTML = ''
			+'<span class="regionHolder" id="' +idPre+ 'Holder">'
			+ '<div id="' +idPre+ 'Selecter" class="regionSelBox"></div>'
			+ '<a href="javascript:;" id="' +idPre+ 'Path" class="regionPath" title="点击弹出地区选择下拉框,移走鼠标会自动隐藏"><span id="' +idPre+ 'PathName" >请选择地区</span><span class="regionArrow" id="' +idPre+ 'Arrow">&darr;</span></a>'
			+ '</span>';
		if ('function' != typeof changeFuc) return nameSpace.E('请把' +thisFuc+ '的 changeFuc 变量设置为function对象');
		try {//如果指定了行政区域的显示开始范围
			if (path && path.indexOf('[') > -1) {
				eval('path = nameSpace.regions' +path);//保持结构
			} else {
				path = nameSpace.regions;
			}
		} catch (e) {nameSpace.E(thisFuc+ '的path变量值有误,被忽略', e)}
		
		if ('object' != typeof path) {//指定行政区域范围获取失败,重置为全部
			path = nameSpace.regions;
			nameSpace.E(thisFuc+ '的path变量值有误,重置成全部');
		}
		
		if (initRegions.length) initRegions = '/' +initRegions+ '/';
		var spreadId = '';//上个展开路径
		var initRegions2 = '/';
		var mkHtml = function(regoinObj, linePre, loop, idPreVar){//递归生成行政下载html
			if ('number' != typeof loop) loop = 1;			
			if (maxLevel && loop > maxLevel) return '';//达到最小行政区域级数	
			if ('string' != typeof linePre) linePre = '';
			if ('string' != typeof idPreVar) idPreVar = idPre+ 'A';
			if ('.object.string.'.indexOf('.' +(typeof regoinObj) + '.') < 0) return '';
			var htm = '';
			
			for (var fi = 0; fi < regoinObj.length; fi++) {
				var fiObj = regoinObj[fi];
				var fiSub = null;
				
				if ('string' == typeof fiObj) {//没子级,有效
					
				} else if ([].constructor == fiObj.constructor) {//有子级
					fiSub = fiObj[1];
					fiObj = fiObj[0];
				} else {//无效无法处理的行政数据
					nameSpace.E('出错,不明的区域值', fiObj);
					continue;
				}
				
				var j = '<span class="regionDot">' +('' == linePre + htm ? '┏' /*没上层*/ :'┣') + '</span>';//树分叉点
				var p = '<span class="regionGLine">┃</span>';//同级树叉点虚连线,不能用┇,在ie下面认为是半角符号
				var idPath = idPreVar +'_'+ fi;				
				var asc = '';//选择中的样式
				
				if (1 == regoinObj.length) {//只有一个
					j = p = '';
				} else if (fi + 1 >= regoinObj.length) {//最后一组
					j = '<span class="regionDot">┗</span>';
					p = '<span class="regionBlank">┃</span>';//末行左边右移1┗(全角)
				}
				
				if (0 == initRegions.indexOf(initRegions2 +fiObj+ '/')) {//初始化时选中的行政区域
					initRegions2 += fiObj+'/';
					asc = ahcn;						
					spreadId = idPath;//记住最新的id
				}
					
				htm += '<a href="javascript:;" target="_self" name="' +idPre+ 'SubAS" id="' +idPath+ '" class="' +asc+ '" value="' +escape(fiObj)+ '" title="' +fiObj+ '">' +linePre+j+ '<span class="regionName">' +fiObj+ '</span></a>';
				
				if (fiSub) {//有子级
					htm += '<div class="regionSub" id="' +idPath+ 'Sub" style="' +(asc.length ? 'display:block;': '')+ '">' 
						+mkHtml(fiSub, linePre+'<span class="regionTxtBlank">' +p+ '</span>', loop+1, idPath)
						+ '</div>';
				}
			}
			
			return htm;
		};
		var classAdd = function(id, c) {//加类
			var cn = ID(id).className;
			ID(id).className = !cn ? c : ((' ' +cn+ ' ').replace(new RegExp(' ' +c+ ' ', 'g'), '') + ' ' +c).replace(/^\s+|\s+$/, '');
		};
		var classDel = function(id, c) {//删除类
			var cn = ID(id).className;
			if (!cn) return;
			ID(id).className = (' ' +cn+ ' ').replace(new RegExp(' ' +c+ ' ', 'g'), '').replace(/^\s+|\s+$/, '');
		};
		ID(idPre+ 'Selecter').innerHTML = mkHtml(path);
		initRegions2 = initRegions2.replace(/^\/|\/$/g, '');//注意不能使用给出的默认值,可能给出行政区域路径有误,只能使用经过过滤后的.
		
		if (initRegions.length && initRegions2.length) {//有初始化的行政区域,也触发改变事件			
			ID(idPre+ 'PathName').innerHTML = initRegions2;
			changeFuc(initRegions2.split('/'));
		}
		var pathHeight = 0;
		ID(idPre+ 'Path').onclick = function(){
			//有可能被放到父结构是display:none;结构中,所以,只能在显示时再获取内容高度
			if (!pathHeight) {//只取一次,防止显示下拉后父高度就有误
				pathHeight = ID(idPre+ 'Holder').offsetHeight - 2;//向上提一点,防止掉出父框下边
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
		
		for (var fi = 0; fi < regionSubA.length; fi++) {//为所有的行政对象a绑定点击事件
			if (!regionSubA[fi].tagName) continue;
			regionSubA[fi].onclick = function() {//点击
				var id = this.id;
				classAdd(id, ahcn);//高亮
				var s = ID(id+'Sub');
				var clkPath = [];
				var clkIds = id.split('_');
				var clkId = clkIds[0];

				for (var fi = 1 /* 0为前缀 */; fi < clkIds.length; fi++) {//取出完整路径
					clkId += '_' +clkIds[fi];
					clkPath[clkPath.length] = unescape(ID(clkId).getAttribute('value'));
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
						if (ID(cutId+'Sub')) {
							ID(cutId+'Sub').style.display = 'none';
						}
						
						classDel(cutId, ahcn);//移除高亮
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
	if (!document.body) return nameSpace.E('未找到document.body请把本js移动到<body>标签之后载入,在ie7以下,需要明确写入<body>标签,浏览器不会自动添加');
	if ('complete' == window.document.readyState) return nameSpace.E('本js不允许在onload后加载,因为会导致获取本身src失败的方法失效');
	//自动获取本身src的方法不能在onload后,否则在ff中会失败
	var js = document.getElementsByTagName('SCRIPT');	
	if (!js || !js.length) return nameSpace.E('兼容问题,无法获取js自身src');
	js = js[js.length -1];
	var src = js.src;
	if (!src) return nameSpace.E('取不到js的src属性');
	var jsDir = src.replace(/[^\/]+\.js([#\?].*)?$/, '');
	//行政数据可能比较大,延时仿ajax加载
	var js = document.createElement('SCRIPT');
	js.src = jsDir+ 'regions.js';
	js.id = 'regionsJsScript';
	js.setAttribute('load4init', nameSpace.NS+ '._init');
	document.body.appendChild(js);
})('regions');