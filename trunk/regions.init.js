(function(nameSpace, debug) {	
	(function(){
		if (!document.documentElement || !document.documentElement.appendChild) return this.E('未找可供script标签的加载对象,请尝试把本js移动到<body>标签之后载入');
		if ('complete' == window.document.readyState) return this.E('本js不允许在window.onload后加载,因为会导致获取本身src失败的方法失效');
		//自动获取本身src的方法不能在onload后,否则在ff中会失败
		var js = document.getElementsByTagName('SCRIPT');	
		if (!js || !js.length) return this.E('兼容问题,无法获取js自身src');
		js = js[js.length -1];
		var src = js.src;
		if (!src) return this.E('取不到js的src属性');
		var jsDir = src.replace(/[^\/]+\.js([#\?].*)?$/, '');
		//行政数据可能比较大,延时仿ajax加载
		var js = document.createElement('SCRIPT');
		js.src = jsDir+ 'regions.js';
		js.id = 'regionsJsScript';
		js.setAttribute('load4init', this.NS+ '._init');
		document.documentElement.appendChild(js);
	}).call(window[nameSpace] = {
		NS:'window.' +nameSpace
		,debug:debug
		,E : function() {
			var tip = [];			
			for (var fi = 0; fi < arguments.length; fi++) tip[tip.length] = arguments[fi];
			tip = '\n' +tip.join('\n');
			for (var fi = 100;fi > 0; fi--) tip = '*' +tip;
			tip =  arguments.callee.caller + '\n\n扔出的错误提示:\n\n' +tip;			
			if (window.console && window.console.log) console.log(tip);
			else if (this.debug) window.prompt('出错的提示如下', tip);
		}
		,load : function(func){//行政数据异步加载,所以,需要立刻回调,请使用本方法,如 前缀.load(function(){前缀.toSelect();});
			//ie会把整个js处理完成才处理下个script块
			if ('object' == typeof this.regions) return func.call(this);		
			('object' != typeof this.loadFuns) && (this.loadFuns = []);
			this.loadFuns[this.loadFuns.length] = func;
		}
		,css : function(cssTxt){//写入css代码块
			var style = document.createElement('STYLE');
			style.type="text/css";		
			if (style.styleSheet)  style.styleSheet.cssText = cssTxt;//ie6
				else style.innerHTML = cssTxt;		
			var head = document.getElementsByTagName('HEAD');
			if (!head) return this.E('写入css代码块失败,找不到head标签');
			head = head.length ? head[0] : head;
			head.appendChild(style);
		}
		,toSelect : function (
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
			if ('object' != typeof box || !box.tagName) return this.E('请把' +thisFuc+ '的 box变量 指向一个html对象(或是它的ID字符串)');
			if (!this.toSelectI) this.toSelectI = 0;
			var idPre = 'regionTS' + this.toSelectI++;
			var maxHeight = 300;//下拉的高度
			var ahcn = 'regionHL';//选择区域高亮类
			var clsPre = 'span.regionHolder ';
			this.toSelectI < 2 && this.css(//只需要样式一次
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
			if ('function' != typeof changeFuc) return this.E('请把' +thisFuc+ '的 changeFuc 变量设置为function对象');
			try {//如果指定了行政区域的显示开始范围
				if (path && path.indexOf('[') > -1) {
					eval('path = this.regions' +path);//保持结构
				} else {
					path = this.regions;
				}
			} catch (e) {this.E(thisFuc+ '的path变量值有误,被忽略', e)}
			
			if ('object' != typeof path) {//指定行政区域范围获取失败,重置为全部
				path = this.regions;
				this.E(thisFuc+ '的path变量值有误,重置成全部');
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
						this.E('出错,不明的区域值', fiObj);
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
		}	
		,_init : function(_regions_){//数据加载完成.开始执行
			this.regions = _regions_;
			if ('object' != typeof this.loadFuns || !this.loadFuns.length) return;//ie加载顺序不同
			for (var fi =0; fi<this.loadFuns.length;fi++)
				'function' == typeof this.loadFuns[fi] && this.loadFuns[fi].call(this);
		}
	});
})('regions', true);