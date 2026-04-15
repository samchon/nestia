(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2806],{28734:function(t){var e;e=function(){return function(t,e){var i=e.prototype,s=i.format;i.format=function(t){var e=this,i=this.$locale();if(!this.isValid())return s.bind(this)(t);var n=this.$utils(),r=(t||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(t){switch(t){case"Q":return Math.ceil((e.$M+1)/3);case"Do":return i.ordinal(e.$D);case"gggg":return e.weekYear();case"GGGG":return e.isoWeekYear();case"wo":return i.ordinal(e.week(),"W");case"w":case"ww":return n.s(e.week(),"w"===t?1:2,"0");case"W":case"WW":return n.s(e.isoWeek(),"W"===t?1:2,"0");case"k":case"kk":return n.s(String(0===e.$H?24:e.$H),"k"===t?1:2,"0");case"X":return Math.floor(e.$d.getTime()/1e3);case"x":return e.$d.getTime();case"z":return"["+e.offsetName()+"]";case"zzz":return"["+e.offsetName("long")+"]";default:return t}});return s.bind(this)(r)}}},t.exports=e()},10285:function(t){var e;e=function(){"use strict";var t={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},e=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,i=/\d/,s=/\d\d/,n=/\d\d?/,r=/\d*[^-_:/,()\s\d]+/,a={},o=function(t){return(t=+t)+(t>68?1900:2e3)},c=function(t){return function(e){this[t]=+e}},l=[/[+-]\d\d:?(\d\d)?|Z/,function(t){(this.zone||(this.zone={})).offset=function(t){if(!t||"Z"===t)return 0;var e=t.match(/([+-]|\d\d)/g),i=60*e[1]+(+e[2]||0);return 0===i?0:"+"===e[0]?-i:i}(t)}],d=function(t){var e=a[t];return e&&(e.indexOf?e:e.s.concat(e.f))},u=function(t,e){var i,s=a.meridiem;if(s){for(var n=1;n<=24;n+=1)if(t.indexOf(s(n,0,e))>-1){i=n>12;break}}else i=t===(e?"pm":"PM");return i},h={A:[r,function(t){this.afternoon=u(t,!1)}],a:[r,function(t){this.afternoon=u(t,!0)}],Q:[i,function(t){this.month=3*(t-1)+1}],S:[i,function(t){this.milliseconds=100*+t}],SS:[s,function(t){this.milliseconds=10*+t}],SSS:[/\d{3}/,function(t){this.milliseconds=+t}],s:[n,c("seconds")],ss:[n,c("seconds")],m:[n,c("minutes")],mm:[n,c("minutes")],H:[n,c("hours")],h:[n,c("hours")],HH:[n,c("hours")],hh:[n,c("hours")],D:[n,c("day")],DD:[s,c("day")],Do:[r,function(t){var e=a.ordinal,i=t.match(/\d+/);if(this.day=i[0],e)for(var s=1;s<=31;s+=1)e(s).replace(/\[|\]/g,"")===t&&(this.day=s)}],w:[n,c("week")],ww:[s,c("week")],M:[n,c("month")],MM:[s,c("month")],MMM:[r,function(t){var e=d("months"),i=(d("monthsShort")||e.map(function(t){return t.slice(0,3)})).indexOf(t)+1;if(i<1)throw Error();this.month=i%12||i}],MMMM:[r,function(t){var e=d("months").indexOf(t)+1;if(e<1)throw Error();this.month=e%12||e}],Y:[/[+-]?\d+/,c("year")],YY:[s,function(t){this.year=o(t)}],YYYY:[/\d{4}/,c("year")],Z:l,ZZ:l};return function(i,s,n){n.p.customParseFormat=!0,i&&i.parseTwoDigitYear&&(o=i.parseTwoDigitYear);var r=s.prototype,c=r.parse;r.parse=function(i){var s=i.date,r=i.utc,o=i.args;this.$u=r;var l=o[1];if("string"==typeof l){var d=!0===o[2],u=!0===o[3],f=o[2];u&&(f=o[2]),a=this.$locale(),!d&&f&&(a=n.Ls[f]),this.$d=function(i,s,n,r){try{if(["x","X"].indexOf(s)>-1)return new Date(("X"===s?1e3:1)*i);var o=(function(i){var s,n;s=i,n=a&&a.formats;for(var r=(i=s.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(e,i,s){var r=s&&s.toUpperCase();return i||n[s]||t[s]||n[r].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(t,e,i){return e||i.slice(1)})})).match(e),o=r.length,c=0;c<o;c+=1){var l=r[c],d=h[l],u=d&&d[0],f=d&&d[1];r[c]=f?{regex:u,parser:f}:l.replace(/^\[|\]$/g,"")}return function(t){for(var e={},i=0,s=0;i<o;i+=1){var n=r[i];if("string"==typeof n)s+=n.length;else{var a=n.regex,c=n.parser,l=t.slice(s),d=a.exec(l)[0];c.call(e,d),t=t.replace(d,"")}}return function(t){var e=t.afternoon;if(void 0!==e){var i=t.hours;e?i<12&&(t.hours+=12):12===i&&(t.hours=0),delete t.afternoon}}(e),e}})(s)(i),c=o.year,l=o.month,d=o.day,u=o.hours,f=o.minutes,m=o.seconds,y=o.milliseconds,k=o.zone,p=o.week,g=new Date,v=d||(c||l?1:g.getDate()),T=c||g.getFullYear(),x=0;c&&!l||(x=l>0?l-1:g.getMonth());var b,$=u||0,w=f||0,_=m||0,W=y||0;return k?new Date(Date.UTC(T,x,v,$,w,_,W+60*k.offset*1e3)):n?new Date(Date.UTC(T,x,v,$,w,_,W)):(b=new Date(T,x,v,$,w,_,W),p&&(b=r(b).week(p).toDate()),b)}catch(t){return new Date("")}}(s,l,r,n),this.init(),f&&!0!==f&&(this.$L=this.locale(f).$L),(d||u)&&s!=this.format(l)&&(this.$d=new Date("")),a={}}else if(l instanceof Array)for(var m=l.length,y=1;y<=m;y+=1){o[1]=l[y-1];var k=n.apply(this,o);if(k.isValid()){this.$d=k.$d,this.$L=k.$L,this.init();break}y===m&&(this.$d=new Date(""))}else c.call(this,i)}}},t.exports=e()},1646:function(t){var e;e=function(){"use strict";var t,e,i=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,s=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,n={years:31536e6,months:2628e6,days:864e5,hours:36e5,minutes:6e4,seconds:1e3,milliseconds:1,weeks:6048e5},r=function(t){return t instanceof u},a=function(t,e,i){return new u(t,i,e.$l)},o=function(t){return e.p(t)+"s"},c=function(t){return t<0},l=function(t){return c(t)?Math.ceil(t):Math.floor(t)},d=function(t,e){return t?c(t)?{negative:!0,format:""+Math.abs(t)+e}:{negative:!1,format:""+t+e}:{negative:!1,format:""}},u=function(){function c(t,e,i){var r=this;if(this.$d={},this.$l=i,void 0===t&&(this.$ms=0,this.parseFromMilliseconds()),e)return a(t*n[o(e)],this);if("number"==typeof t)return this.$ms=t,this.parseFromMilliseconds(),this;if("object"==typeof t)return Object.keys(t).forEach(function(e){r.$d[o(e)]=t[e]}),this.calMilliseconds(),this;if("string"==typeof t){var c=t.match(s);if(c){var l=c.slice(2).map(function(t){return null!=t?Number(t):0});return this.$d.years=l[0],this.$d.months=l[1],this.$d.weeks=l[2],this.$d.days=l[3],this.$d.hours=l[4],this.$d.minutes=l[5],this.$d.seconds=l[6],this.calMilliseconds(),this}}return this}var u=c.prototype;return u.calMilliseconds=function(){var t=this;this.$ms=Object.keys(this.$d).reduce(function(e,i){return e+(t.$d[i]||0)*n[i]},0)},u.parseFromMilliseconds=function(){var t=this.$ms;this.$d.years=l(t/31536e6),t%=31536e6,this.$d.months=l(t/2628e6),t%=2628e6,this.$d.days=l(t/864e5),t%=864e5,this.$d.hours=l(t/36e5),t%=36e5,this.$d.minutes=l(t/6e4),t%=6e4,this.$d.seconds=l(t/1e3),t%=1e3,this.$d.milliseconds=t},u.toISOString=function(){var t=d(this.$d.years,"Y"),e=d(this.$d.months,"M"),i=+this.$d.days||0;this.$d.weeks&&(i+=7*this.$d.weeks);var s=d(i,"D"),n=d(this.$d.hours,"H"),r=d(this.$d.minutes,"M"),a=this.$d.seconds||0;this.$d.milliseconds&&(a+=this.$d.milliseconds/1e3,a=Math.round(1e3*a)/1e3);var o=d(a,"S"),c=t.negative||e.negative||s.negative||n.negative||r.negative||o.negative,l=n.format||r.format||o.format?"T":"",u=(c?"-":"")+"P"+t.format+e.format+s.format+l+n.format+r.format+o.format;return"P"===u||"-P"===u?"P0D":u},u.toJSON=function(){return this.toISOString()},u.format=function(t){var s={Y:this.$d.years,YY:e.s(this.$d.years,2,"0"),YYYY:e.s(this.$d.years,4,"0"),M:this.$d.months,MM:e.s(this.$d.months,2,"0"),D:this.$d.days,DD:e.s(this.$d.days,2,"0"),H:this.$d.hours,HH:e.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:e.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:e.s(this.$d.seconds,2,"0"),SSS:e.s(this.$d.milliseconds,3,"0")};return(t||"YYYY-MM-DDTHH:mm:ss").replace(i,function(t,e){return e||String(s[t])})},u.as=function(t){return this.$ms/n[o(t)]},u.get=function(t){var e=this.$ms,i=o(t);return"milliseconds"===i?e%=1e3:e="weeks"===i?l(e/n[i]):this.$d[i],e||0},u.add=function(t,e,i){var s;return s=e?t*n[o(e)]:r(t)?t.$ms:a(t,this).$ms,a(this.$ms+s*(i?-1:1),this)},u.subtract=function(t,e){return this.add(t,e,!0)},u.locale=function(t){var e=this.clone();return e.$l=t,e},u.clone=function(){return a(this.$ms,this)},u.humanize=function(e){return t().add(this.$ms,"ms").locale(this.$l).fromNow(!e)},u.valueOf=function(){return this.asMilliseconds()},u.milliseconds=function(){return this.get("milliseconds")},u.asMilliseconds=function(){return this.as("milliseconds")},u.seconds=function(){return this.get("seconds")},u.asSeconds=function(){return this.as("seconds")},u.minutes=function(){return this.get("minutes")},u.asMinutes=function(){return this.as("minutes")},u.hours=function(){return this.get("hours")},u.asHours=function(){return this.as("hours")},u.days=function(){return this.get("days")},u.asDays=function(){return this.as("days")},u.weeks=function(){return this.get("weeks")},u.asWeeks=function(){return this.as("weeks")},u.months=function(){return this.get("months")},u.asMonths=function(){return this.as("months")},u.years=function(){return this.get("years")},u.asYears=function(){return this.as("years")},c}(),h=function(t,e,i){return t.add(e.years()*i,"y").add(e.months()*i,"M").add(e.days()*i,"d").add(e.hours()*i,"h").add(e.minutes()*i,"m").add(e.seconds()*i,"s").add(e.milliseconds()*i,"ms")};return function(i,s,n){t=n,e=n().$utils(),n.duration=function(t,e){return a(t,{$l:n.locale()},e)},n.isDuration=r;var o=s.prototype.add,c=s.prototype.subtract;s.prototype.add=function(t,e){return r(t)?h(this,t,1):o.bind(this)(t,e)},s.prototype.subtract=function(t,e){return r(t)?h(this,t,-1):c.bind(this)(t,e)}}},t.exports=e()},59542:function(t){var e;e=function(){return function(t,e,i){var s=function(t){return t.add(4-t.isoWeekday(),"day")},n=e.prototype;n.isoWeekYear=function(){return s(this).year()},n.isoWeek=function(t){if(!this.$utils().u(t))return this.add(7*(t-this.isoWeek()),"day");var e,n,r,a=s(this),o=(e=this.isoWeekYear(),r=4-(n=(this.$u?i.utc:i)().year(e).startOf("year")).isoWeekday(),n.isoWeekday()>4&&(r+=7),n.add(r,"day"));return a.diff(o,"week")+1},n.isoWeekday=function(t){return this.$utils().u(t)?this.day()||7:this.day(this.day()%7?t:t-7)};var r=n.startOf;n.startOf=function(t,e){var i=this.$utils(),s=!!i.u(e)||e;return"isoweek"===i.p(t)?s?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):r.bind(this)(t,e)}}},t.exports=e()},52806:function(t,e,i){"use strict";i.d(e,{diagram:function(){return tF}});var s,n,r,a=i(82436),o=i(92161),c=i(35096),l=i(17967),d=i(27484),u=i(59542),h=i(10285),f=i(28734),m=i(1646),y=i(1251),k=function(){var t=(0,c.eW)(function(t,e,i,s){for(i=i||{},s=t.length;s--;i[t[s]]=e);return i},"o"),e=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],i=[1,26],s=[1,27],n=[1,28],r=[1,29],a=[1,30],o=[1,31],l=[1,32],d=[1,33],u=[1,34],h=[1,9],f=[1,10],m=[1,11],y=[1,12],k=[1,13],p=[1,14],g=[1,15],v=[1,16],T=[1,19],x=[1,20],b=[1,21],$=[1,22],w=[1,23],_=[1,25],W=[1,35],D={trace:(0,c.eW)(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:(0,c.eW)(function(t,e,i,s,n,r,a){var o=r.length-1;switch(n){case 1:return r[o-1];case 2:case 6:case 7:this.$=[];break;case 3:r[o-1].push(r[o]),this.$=r[o-1];break;case 4:case 5:this.$=r[o];break;case 8:s.setWeekday("monday");break;case 9:s.setWeekday("tuesday");break;case 10:s.setWeekday("wednesday");break;case 11:s.setWeekday("thursday");break;case 12:s.setWeekday("friday");break;case 13:s.setWeekday("saturday");break;case 14:s.setWeekday("sunday");break;case 15:s.setWeekend("friday");break;case 16:s.setWeekend("saturday");break;case 17:s.setDateFormat(r[o].substr(11)),this.$=r[o].substr(11);break;case 18:s.enableInclusiveEndDates(),this.$=r[o].substr(18);break;case 19:s.TopAxis(),this.$=r[o].substr(8);break;case 20:s.setAxisFormat(r[o].substr(11)),this.$=r[o].substr(11);break;case 21:s.setTickInterval(r[o].substr(13)),this.$=r[o].substr(13);break;case 22:s.setExcludes(r[o].substr(9)),this.$=r[o].substr(9);break;case 23:s.setIncludes(r[o].substr(9)),this.$=r[o].substr(9);break;case 24:s.setTodayMarker(r[o].substr(12)),this.$=r[o].substr(12);break;case 27:s.setDiagramTitle(r[o].substr(6)),this.$=r[o].substr(6);break;case 28:this.$=r[o].trim(),s.setAccTitle(this.$);break;case 29:case 30:this.$=r[o].trim(),s.setAccDescription(this.$);break;case 31:s.addSection(r[o].substr(8)),this.$=r[o].substr(8);break;case 33:s.addTask(r[o-1],r[o]),this.$="task";break;case 34:this.$=r[o-1],s.setClickEvent(r[o-1],r[o],null);break;case 35:this.$=r[o-2],s.setClickEvent(r[o-2],r[o-1],r[o]);break;case 36:this.$=r[o-2],s.setClickEvent(r[o-2],r[o-1],null),s.setLink(r[o-2],r[o]);break;case 37:this.$=r[o-3],s.setClickEvent(r[o-3],r[o-2],r[o-1]),s.setLink(r[o-3],r[o]);break;case 38:this.$=r[o-2],s.setClickEvent(r[o-2],r[o],null),s.setLink(r[o-2],r[o-1]);break;case 39:this.$=r[o-3],s.setClickEvent(r[o-3],r[o-1],r[o]),s.setLink(r[o-3],r[o-2]);break;case 40:this.$=r[o-1],s.setLink(r[o-1],r[o]);break;case 41:case 47:this.$=r[o-1]+" "+r[o];break;case 42:case 43:case 45:this.$=r[o-2]+" "+r[o-1]+" "+r[o];break;case 44:case 46:this.$=r[o-3]+" "+r[o-2]+" "+r[o-1]+" "+r[o]}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:i,13:s,14:n,15:r,16:a,17:o,18:l,19:18,20:d,21:u,22:h,23:f,24:m,25:y,26:k,27:p,28:g,29:v,30:T,31:x,33:b,35:$,36:w,37:24,38:_,40:W},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:36,11:17,12:i,13:s,14:n,15:r,16:a,17:o,18:l,19:18,20:d,21:u,22:h,23:f,24:m,25:y,26:k,27:p,28:g,29:v,30:T,31:x,33:b,35:$,36:w,37:24,38:_,40:W},t(e,[2,5]),t(e,[2,6]),t(e,[2,17]),t(e,[2,18]),t(e,[2,19]),t(e,[2,20]),t(e,[2,21]),t(e,[2,22]),t(e,[2,23]),t(e,[2,24]),t(e,[2,25]),t(e,[2,26]),t(e,[2,27]),{32:[1,37]},{34:[1,38]},t(e,[2,30]),t(e,[2,31]),t(e,[2,32]),{39:[1,39]},t(e,[2,8]),t(e,[2,9]),t(e,[2,10]),t(e,[2,11]),t(e,[2,12]),t(e,[2,13]),t(e,[2,14]),t(e,[2,15]),t(e,[2,16]),{41:[1,40],43:[1,41]},t(e,[2,4]),t(e,[2,28]),t(e,[2,29]),t(e,[2,33]),t(e,[2,34],{42:[1,42],43:[1,43]}),t(e,[2,40],{41:[1,44]}),t(e,[2,35],{43:[1,45]}),t(e,[2,36]),t(e,[2,38],{42:[1,46]}),t(e,[2,37]),t(e,[2,39])],defaultActions:{},parseError:(0,c.eW)(function(t,e){if(e.recoverable)this.trace(t);else{var i=Error(t);throw i.hash=e,i}},"parseError"),parse:(0,c.eW)(function(t){var e=this,i=[0],s=[],n=[null],r=[],a=this.table,o="",l=0,d=0,u=0,h=r.slice.call(arguments,1),f=Object.create(this.lexer),m={yy:{}};for(var y in this.yy)Object.prototype.hasOwnProperty.call(this.yy,y)&&(m.yy[y]=this.yy[y]);f.setInput(t,m.yy),m.yy.lexer=f,m.yy.parser=this,void 0===f.yylloc&&(f.yylloc={});var k=f.yylloc;r.push(k);var p=f.options&&f.options.ranges;function g(){var t;return"number"!=typeof(t=s.pop()||f.lex()||1)&&(t instanceof Array&&(t=(s=t).pop()),t=e.symbols_[t]||t),t}"function"==typeof m.yy.parseError?this.parseError=m.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError,(0,c.eW)(function(t){i.length=i.length-2*t,n.length=n.length-t,r.length=r.length-t},"popStack"),(0,c.eW)(g,"lex");for(var v,T,x,b,$,w,_,W,D,S={};;){if(x=i[i.length-1],this.defaultActions[x]?b=this.defaultActions[x]:(null==v&&(v=g()),b=a[x]&&a[x][v]),void 0===b||!b.length||!b[0]){var C="";for(w in D=[],a[x])this.terminals_[w]&&w>2&&D.push("'"+this.terminals_[w]+"'");C=f.showPosition?"Parse error on line "+(l+1)+":\n"+f.showPosition()+"\nExpecting "+D.join(", ")+", got '"+(this.terminals_[v]||v)+"'":"Parse error on line "+(l+1)+": Unexpected "+(1==v?"end of input":"'"+(this.terminals_[v]||v)+"'"),this.parseError(C,{text:f.match,token:this.terminals_[v]||v,line:f.yylineno,loc:k,expected:D})}if(b[0]instanceof Array&&b.length>1)throw Error("Parse Error: multiple actions possible at state: "+x+", token: "+v);switch(b[0]){case 1:i.push(v),n.push(f.yytext),r.push(f.yylloc),i.push(b[1]),v=null,T?(v=T,T=null):(d=f.yyleng,o=f.yytext,l=f.yylineno,k=f.yylloc,u>0&&u--);break;case 2:if(_=this.productions_[b[1]][1],S.$=n[n.length-_],S._$={first_line:r[r.length-(_||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(_||1)].first_column,last_column:r[r.length-1].last_column},p&&(S._$.range=[r[r.length-(_||1)].range[0],r[r.length-1].range[1]]),void 0!==($=this.performAction.apply(S,[o,d,l,m.yy,b[1],n,r].concat(h))))return $;_&&(i=i.slice(0,-1*_*2),n=n.slice(0,-1*_),r=r.slice(0,-1*_)),i.push(this.productions_[b[1]][0]),n.push(S.$),r.push(S._$),W=a[i[i.length-2]][i[i.length-1]],i.push(W);break;case 3:return!0}}return!0},"parse")},S={EOF:1,parseError:(0,c.eW)(function(t,e){if(this.yy.parser)this.yy.parser.parseError(t,e);else throw Error(t)},"parseError"),setInput:(0,c.eW)(function(t,e){return this.yy=e||this.yy||{},this._input=t,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:(0,c.eW)(function(){var t=this._input[0];return this.yytext+=t,this.yyleng++,this.offset++,this.match+=t,this.matched+=t,t.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),t},"input"),unput:(0,c.eW)(function(t){var e=t.length,i=t.split(/(?:\r\n?|\n)/g);this._input=t+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-e),this.offset-=e;var s=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),i.length-1&&(this.yylineno-=i.length-1);var n=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:i?(i.length===s.length?this.yylloc.first_column:0)+s[s.length-i.length].length-i[0].length:this.yylloc.first_column-e},this.options.ranges&&(this.yylloc.range=[n[0],n[0]+this.yyleng-e]),this.yyleng=this.yytext.length,this},"unput"),more:(0,c.eW)(function(){return this._more=!0,this},"more"),reject:(0,c.eW)(function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},"reject"),less:(0,c.eW)(function(t){this.unput(this.match.slice(t))},"less"),pastInput:(0,c.eW)(function(){var t=this.matched.substr(0,this.matched.length-this.match.length);return(t.length>20?"...":"")+t.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:(0,c.eW)(function(){var t=this.match;return t.length<20&&(t+=this._input.substr(0,20-t.length)),(t.substr(0,20)+(t.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:(0,c.eW)(function(){var t=this.pastInput(),e=Array(t.length+1).join("-");return t+this.upcomingInput()+"\n"+e+"^"},"showPosition"),test_match:(0,c.eW)(function(t,e){var i,s,n;if(this.options.backtrack_lexer&&(n={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(n.yylloc.range=this.yylloc.range.slice(0))),(s=t[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=s.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:s?s[s.length-1].length-s[s.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+t[0].length},this.yytext+=t[0],this.match+=t[0],this.matches=t,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(t[0].length),this.matched+=t[0],i=this.performAction.call(this,this.yy,this,e,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),i)return i;if(this._backtrack)for(var r in n)this[r]=n[r];return!1},"test_match"),next:(0,c.eW)(function(){if(this.done)return this.EOF;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var t,e,i,s,n=this._currentRules(),r=0;r<n.length;r++)if((i=this._input.match(this.rules[n[r]]))&&(!e||i[0].length>e[0].length)){if(e=i,s=r,this.options.backtrack_lexer){if(!1!==(t=this.test_match(i,n[r])))return t;if(!this._backtrack)return!1;e=!1;continue}if(!this.options.flex)break}return e?!1!==(t=this.test_match(e,n[s]))&&t:""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:(0,c.eW)(function(){return this.next()||this.lex()},"lex"),begin:(0,c.eW)(function(t){this.conditionStack.push(t)},"begin"),popState:(0,c.eW)(function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:(0,c.eW)(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:(0,c.eW)(function(t){return(t=this.conditionStack.length-1-Math.abs(t||0))>=0?this.conditionStack[t]:"INITIAL"},"topState"),pushState:(0,c.eW)(function(t){this.begin(t)},"pushState"),stateStackSize:(0,c.eW)(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:(0,c.eW)(function(t,e,i,s){switch(i){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:case 15:case 18:case 21:case 24:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:case 9:case 10:case 12:case 13:break;case 11:return 10;case 14:this.begin("href");break;case 16:return 43;case 17:this.begin("callbackname");break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 22:return 42;case 23:this.begin("click");break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};function C(){this.yy={}}return D.lexer=S,(0,c.eW)(C,"Parser"),C.prototype=D,D.Parser=C,new C}();k.parser=k,d.extend(u),d.extend(h),d.extend(f);var p={friday:5,saturday:6},g="",v="",T=void 0,x="",b=[],$=[],w=new Map,_=[],W=[],D="",S="",C=["active","done","crit","milestone","vert"],M=[],Y="",E=!1,L=!1,O="sunday",A="saturday",I=0,F=(0,c.eW)(function(){_=[],W=[],D="",M=[],tk=0,s=void 0,n=void 0,tT=[],g="",v="",S="",T=void 0,x="",b=[],$=[],E=!1,L=!1,I=0,w=new Map,Y="",(0,o.ZH)(),O="sunday",A="saturday"},"clear"),P=(0,c.eW)(function(t){Y=t},"setDiagramId"),N=(0,c.eW)(function(t){v=t},"setAxisFormat"),H=(0,c.eW)(function(){return v},"getAxisFormat"),z=(0,c.eW)(function(t){T=t},"setTickInterval"),B=(0,c.eW)(function(){return T},"getTickInterval"),j=(0,c.eW)(function(t){x=t},"setTodayMarker"),R=(0,c.eW)(function(){return x},"getTodayMarker"),G=(0,c.eW)(function(t){g=t},"setDateFormat"),V=(0,c.eW)(function(){E=!0},"enableInclusiveEndDates"),Z=(0,c.eW)(function(){return E},"endDatesAreInclusive"),U=(0,c.eW)(function(){L=!0},"enableTopAxis"),q=(0,c.eW)(function(){return L},"topAxisEnabled"),X=(0,c.eW)(function(t){S=t},"setDisplayMode"),Q=(0,c.eW)(function(){return S},"getDisplayMode"),K=(0,c.eW)(function(){return g},"getDateFormat"),J=(0,c.eW)(function(t){b=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),tt=(0,c.eW)(function(){return b},"getIncludes"),te=(0,c.eW)(function(t){$=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),ti=(0,c.eW)(function(){return $},"getExcludes"),ts=(0,c.eW)(function(){return w},"getLinks"),tn=(0,c.eW)(function(t){D=t,_.push(t)},"addSection"),tr=(0,c.eW)(function(){return _},"getSections"),ta=(0,c.eW)(function(){let t=t_(),e=0;for(;!t&&e<10;)t=t_(),e++;return W=tT},"getTasks"),to=(0,c.eW)(function(t,e,i,s){let n=t.format(e.trim()),r=t.format("YYYY-MM-DD");return!(s.includes(n)||s.includes(r))&&(!!(i.includes("weekends")&&(t.isoWeekday()===p[A]||t.isoWeekday()===p[A]+1)||i.includes(t.format("dddd").toLowerCase()))||i.includes(n)||i.includes(r))},"isInvalidDate"),tc=(0,c.eW)(function(t){O=t},"setWeekday"),tl=(0,c.eW)(function(){return O},"getWeekday"),td=(0,c.eW)(function(t){A=t},"setWeekend"),tu=(0,c.eW)(function(t,e,i,s){let n;if(!i.length||t.manualEndTime)return;let[r,a]=th((t.startTime instanceof Date?d(t.startTime):d(t.startTime,e,!0)).add(1,"d"),t.endTime instanceof Date?d(t.endTime):d(t.endTime,e,!0),e,i,s);t.endTime=r.toDate(),t.renderEndTime=a},"checkTaskDates"),th=(0,c.eW)(function(t,e,i,s,n){let r=!1,a=null;for(;t<=e;)r||(a=e.toDate()),(r=to(t,i,s,n))&&(e=e.add(1,"d")),t=t.add(1,"d");return[e,a]},"fixTaskDates"),tf=(0,c.eW)(function(t,e,i){if(i=i.trim(),(0,c.eW)(t=>{let e=t.trim();return"x"===e||"X"===e},"isTimestampFormat")(e)&&/^\d+$/.test(i))return new Date(Number(i));let s=/^after\s+(?<ids>[\d\w- ]+)/.exec(i);if(null!==s){let t=null;for(let e of s.groups.ids.split(" ")){let i=t$(e);void 0!==i&&(!t||i.endTime>t.endTime)&&(t=i)}if(t)return t.endTime;let e=new Date;return e.setHours(0,0,0,0),e}let n=d(i,e.trim(),!0);if(n.isValid())return n.toDate();{c.cM.debug("Invalid date:"+i),c.cM.debug("With date format:"+e.trim());let t=new Date(i);if(void 0===t||isNaN(t.getTime())||-1e4>t.getFullYear()||t.getFullYear()>1e4)throw Error("Invalid date:"+i);return t}},"getStartDate"),tm=(0,c.eW)(function(t){let e=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return null!==e?[Number.parseFloat(e[1]),e[2]]:[NaN,"ms"]},"parseDuration"),ty=(0,c.eW)(function(t,e,i,s=!1){i=i.trim();let n=/^until\s+(?<ids>[\d\w- ]+)/.exec(i);if(null!==n){let t=null;for(let e of n.groups.ids.split(" ")){let i=t$(e);void 0!==i&&(!t||i.startTime<t.startTime)&&(t=i)}if(t)return t.startTime;let e=new Date;return e.setHours(0,0,0,0),e}let r=d(i,e.trim(),!0);if(r.isValid())return s&&(r=r.add(1,"d")),r.toDate();let a=d(t),[o,c]=tm(i);if(!Number.isNaN(o)){let t=a.add(o,c);t.isValid()&&(a=t)}return a.toDate()},"getEndDate"),tk=0,tp=(0,c.eW)(function(t){return void 0===t?"task"+(tk+=1):t},"parseId"),tg=(0,c.eW)(function(t,e){let i=(":"===e.substr(0,1)?e.substr(1,e.length):e).split(","),s={};tL(i,s,C);for(let t=0;t<i.length;t++)i[t]=i[t].trim();let n="";switch(i.length){case 1:s.id=tp(),s.startTime=t.endTime,n=i[0];break;case 2:s.id=tp(),s.startTime=tf(void 0,g,i[0]),n=i[1];break;case 3:s.id=tp(i[0]),s.startTime=tf(void 0,g,i[1]),n=i[2]}return n&&(s.endTime=ty(s.startTime,g,n,E),s.manualEndTime=d(n,"YYYY-MM-DD",!0).isValid(),tu(s,g,$,b)),s},"compileData"),tv=(0,c.eW)(function(t,e){let i=(":"===e.substr(0,1)?e.substr(1,e.length):e).split(","),s={};tL(i,s,C);for(let t=0;t<i.length;t++)i[t]=i[t].trim();switch(i.length){case 1:s.id=tp(),s.startTime={type:"prevTaskEnd",id:t},s.endTime={data:i[0]};break;case 2:s.id=tp(),s.startTime={type:"getStartDate",startData:i[0]},s.endTime={data:i[1]};break;case 3:s.id=tp(i[0]),s.startTime={type:"getStartDate",startData:i[1]},s.endTime={data:i[2]}}return s},"parseData"),tT=[],tx={},tb=(0,c.eW)(function(t,e){let i={section:D,type:D,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:e},task:t,classes:[]},s=tv(n,e);i.raw.startTime=s.startTime,i.raw.endTime=s.endTime,i.id=s.id,i.prevTaskId=n,i.active=s.active,i.done=s.done,i.crit=s.crit,i.milestone=s.milestone,i.vert=s.vert,i.order=I,I++;let r=tT.push(i);n=i.id,tx[i.id]=r-1},"addTask"),t$=(0,c.eW)(function(t){return tT[tx[t]]},"findTaskById"),tw=(0,c.eW)(function(t,e){let i={section:D,type:D,description:t,task:t,classes:[]},n=tg(s,e);i.startTime=n.startTime,i.endTime=n.endTime,i.id=n.id,i.active=n.active,i.done=n.done,i.crit=n.crit,i.milestone=n.milestone,i.vert=n.vert,s=i,W.push(i)},"addTaskOrg"),t_=(0,c.eW)(function(){let t=(0,c.eW)(function(t){let e=tT[t],i="";switch(tT[t].raw.startTime.type){case"prevTaskEnd":{let t=t$(e.prevTaskId);e.startTime=t.endTime;break}case"getStartDate":(i=tf(void 0,g,tT[t].raw.startTime.startData))&&(tT[t].startTime=i)}return tT[t].startTime&&(tT[t].endTime=ty(tT[t].startTime,g,tT[t].raw.endTime.data,E),tT[t].endTime&&(tT[t].processed=!0,tT[t].manualEndTime=d(tT[t].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),tu(tT[t],g,$,b))),tT[t].processed},"compileTask"),e=!0;for(let[i,s]of tT.entries())t(i),e=e&&s.processed;return e},"compileTasks"),tW=(0,c.eW)(function(t,e){let i=e;"loose"!==(0,o.nV)().securityLevel&&(i=(0,l.N)(e)),t.split(",").forEach(function(t){void 0!==t$(t)&&(tC(t,()=>{window.open(i,"_self")}),w.set(t,i))}),tD(t,"clickable")},"setLink"),tD=(0,c.eW)(function(t,e){t.split(",").forEach(function(t){let i=t$(t);void 0!==i&&i.classes.push(e)})},"setClass"),tS=(0,c.eW)(function(t,e,i){if("loose"!==(0,o.nV)().securityLevel||void 0===e)return;let s=[];if("string"==typeof i){s=i.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let t=0;t<s.length;t++){let e=s[t].trim();e.startsWith('"')&&e.endsWith('"')&&(e=e.substr(1,e.length-2)),s[t]=e}}0===s.length&&s.push(t),void 0!==t$(t)&&tC(t,()=>{a.w8.runFunc(e,...s)})},"setClickFun"),tC=(0,c.eW)(function(t,e){M.push(function(){let i=Y?`${Y}-${t}`:t,s=document.querySelector(`[id="${i}"]`);null!==s&&s.addEventListener("click",function(){e()})},function(){let i=Y?`${Y}-${t}`:t,s=document.querySelector(`[id="${i}-text"]`);null!==s&&s.addEventListener("click",function(){e()})})},"pushFun"),tM=(0,c.eW)(function(t,e,i){t.split(",").forEach(function(t){tS(t,e,i)}),tD(t,"clickable")},"setClickEvent"),tY=(0,c.eW)(function(t){M.forEach(function(e){e(t)})},"bindFunctions"),tE={getConfig:(0,c.eW)(()=>(0,o.nV)().gantt,"getConfig"),clear:F,setDateFormat:G,getDateFormat:K,enableInclusiveEndDates:V,endDatesAreInclusive:Z,enableTopAxis:U,topAxisEnabled:q,setAxisFormat:N,getAxisFormat:H,setTickInterval:z,getTickInterval:B,setTodayMarker:j,getTodayMarker:R,setAccTitle:o.GN,getAccTitle:o.eu,setDiagramTitle:o.g2,getDiagramTitle:o.Kr,setDiagramId:P,setDisplayMode:X,getDisplayMode:Q,setAccDescription:o.U$,getAccDescription:o.Mx,addSection:tn,getSections:tr,getTasks:ta,addTask:tb,findTaskById:t$,addTaskOrg:tw,setIncludes:J,getIncludes:tt,setExcludes:te,getExcludes:ti,setClickEvent:tM,setLink:tW,getLinks:ts,bindFunctions:tY,parseDuration:tm,isInvalidDate:to,setWeekday:tc,getWeekday:tl,setWeekend:td};function tL(t,e,i){let s=!0;for(;s;)s=!1,i.forEach(function(i){let n=RegExp("^\\s*"+i+"\\s*$");t[0].match(n)&&(e[i]=!0,t.shift(1),s=!0)})}(0,c.eW)(tL,"getTaskTags"),d.extend(m);var tO=(0,c.eW)(function(){c.cM.debug("Something is calling, setConf, remove the call")},"setConf"),tA={monday:y.Ox9,tuesday:y.YDX,wednesday:y.EFj,thursday:y.Igq,friday:y.y2j,saturday:y.LqH,sunday:y.Zyz},tI=(0,c.eW)((t,e)=>{let i=[...t].map(()=>-1/0),s=[...t].sort((t,e)=>t.startTime-e.startTime||t.order-e.order),n=0;for(let t of s)for(let s=0;s<i.length;s++)if(t.startTime>=i[s]){i[s]=t.endTime,t.order=s+e,s>n&&(n=s);break}return n},"getMaxIntersections"),tF={parser:k,db:tE,renderer:{setConf:tO,draw:(0,c.eW)(function(t,e,i,s){let n;let a=(0,o.nV)().gantt;s.db.setDiagramId(e);let l=(0,o.nV)().securityLevel;"sandbox"===l&&(n=(0,y.Ys)("#i"+e));let u="sandbox"===l?(0,y.Ys)(n.nodes()[0].contentDocument.body):(0,y.Ys)("body"),h="sandbox"===l?n.nodes()[0].contentDocument:document,f=h.getElementById(e);void 0===(r=f.parentElement.offsetWidth)&&(r=1200),void 0!==a.useWidth&&(r=a.useWidth);let m=s.db.getTasks(),k=[];for(let t of m)k.push(t.type);k=C(k);let p={},g=2*a.topPadding;if("compact"===s.db.getDisplayMode()||"compact"===a.displayMode){let t={};for(let e of m)void 0===t[e.section]?t[e.section]=[e]:t[e.section].push(e);let e=0;for(let i of Object.keys(t)){let s=tI(t[i],e)+1;e+=s,g+=s*(a.barHeight+a.barGap),p[i]=s}}else for(let t of(g+=m.length*(a.barHeight+a.barGap),k))p[t]=m.filter(e=>e.type===t).length;f.setAttribute("viewBox","0 0 "+r+" "+g);let v=u.select(`[id="${e}"]`),T=(0,y.Xf)().domain([(0,y.VV$)(m,function(t){return t.startTime}),(0,y.Fp7)(m,function(t){return t.endTime})]).rangeRound([0,r-a.leftPadding-a.rightPadding]);function x(t,e){let i=t.startTime,s=e.startTime,n=0;return i>s?n=1:i<s&&(n=-1),n}function b(t,e,i){let n=a.barHeight,r=n+a.barGap,o=a.topPadding,c=a.leftPadding,l=(0,y.BYU)().domain([0,k.length]).range(["#00B9FA","#F95002"]).interpolate(y.JHv);w(r,o,c,e,i,t,s.db.getExcludes(),s.db.getIncludes()),W(c,o,e,i),$(t,r,o,c,n,l,e,i),D(r,o,c,n,l),S(c,o,e,i)}function $(t,i,n,r,c,l,d){t.sort((t,e)=>t.vert===e.vert?0:t.vert?1:-1);let u=[...new Set(t.map(t=>t.order))].map(e=>t.find(t=>t.order===e));v.append("g").selectAll("rect").data(u).enter().append("rect").attr("x",0).attr("y",function(t,e){return t.order*i+n-2}).attr("width",function(){return d-a.rightPadding/2}).attr("height",i).attr("class",function(t){for(let[e,i]of k.entries())if(t.type===i)return"section section"+e%a.numberSectionStyles;return"section section0"}).enter();let h=v.append("g").selectAll("rect").data(t).enter(),f=s.db.getLinks();if(h.append("rect").attr("id",function(t){return e+"-"+t.id}).attr("rx",3).attr("ry",3).attr("x",function(t){return t.milestone?T(t.startTime)+r+.5*(T(t.endTime)-T(t.startTime))-.5*c:T(t.startTime)+r}).attr("y",function(t,e){return(e=t.order,t.vert)?a.gridLineStartPadding:e*i+n}).attr("width",function(t){return t.milestone?c:t.vert?.08*c:T(t.renderEndTime||t.endTime)-T(t.startTime)}).attr("height",function(t){return t.vert?m.length*(a.barHeight+a.barGap)+2*a.barHeight:c}).attr("transform-origin",function(t,e){return e=t.order,(T(t.startTime)+r+.5*(T(t.endTime)-T(t.startTime))).toString()+"px "+(e*i+n+.5*c).toString()+"px"}).attr("class",function(t){let e="";t.classes.length>0&&(e=t.classes.join(" "));let i=0;for(let[e,s]of k.entries())t.type===s&&(i=e%a.numberSectionStyles);let s="";return t.active?t.crit?s+=" activeCrit":s=" active":t.done?s=t.crit?" doneCrit":" done":t.crit&&(s+=" crit"),0===s.length&&(s=" task"),t.milestone&&(s=" milestone "+s),t.vert&&(s=" vert "+s),"task"+(s+=i+" "+e)}),h.append("text").attr("id",function(t){return e+"-"+t.id+"-text"}).text(function(t){return t.task}).attr("font-size",a.fontSize).attr("x",function(t){let e=T(t.startTime),i=T(t.renderEndTime||t.endTime);if(t.milestone&&(e+=.5*(T(t.endTime)-T(t.startTime))-.5*c,i=e+c),t.vert)return T(t.startTime)+r;let s=this.getBBox().width;return s>i-e?i+s+1.5*a.leftPadding>d?e+r-5:i+r+5:(i-e)/2+e+r}).attr("y",function(t,e){return t.vert?a.gridLineStartPadding+m.length*(a.barHeight+a.barGap)+60:t.order*i+a.barHeight/2+(a.fontSize/2-2)+n}).attr("text-height",c).attr("class",function(t){let e=T(t.startTime),i=T(t.endTime);t.milestone&&(i=e+c);let s=this.getBBox().width,n="";t.classes.length>0&&(n=t.classes.join(" "));let r=0;for(let[e,i]of k.entries())t.type===i&&(r=e%a.numberSectionStyles);let o="";return(t.active&&(o=t.crit?"activeCritText"+r:"activeText"+r),t.done?o=t.crit?o+" doneCritText"+r:o+" doneText"+r:t.crit&&(o=o+" critText"+r),t.milestone&&(o+=" milestoneText"),t.vert&&(o+=" vertText"),s>i-e)?i+s+1.5*a.leftPadding>d?n+" taskTextOutsideLeft taskTextOutside"+r+" "+o:n+" taskTextOutsideRight taskTextOutside"+r+" "+o+" width-"+s:n+" taskText taskText"+r+" "+o+" width-"+s}),"sandbox"===(0,o.nV)().securityLevel){let t=(0,y.Ys)("#i"+e).nodes()[0].contentDocument;h.filter(function(t){return f.has(t.id)}).each(function(i){var s=t.querySelector("#"+CSS.escape(e+"-"+i.id)),n=t.querySelector("#"+CSS.escape(e+"-"+i.id+"-text"));let r=s.parentNode;var a=t.createElement("a");a.setAttribute("xlink:href",f.get(i.id)),a.setAttribute("target","_top"),r.appendChild(a),a.appendChild(s),a.appendChild(n)})}}function w(t,i,n,r,o,l,u,h){let f,m;if(0===u.length&&0===h.length)return;for(let{startTime:t,endTime:e}of l)(void 0===f||t<f)&&(f=t),(void 0===m||e>m)&&(m=e);if(!f||!m)return;if(d(m).diff(d(f),"year")>5){c.cM.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}let y=s.db.getDateFormat(),k=[],p=null,g=d(f);for(;g.valueOf()<=m;)s.db.isInvalidDate(g,y,u,h)?p?p.end=g:p={start:g,end:g}:p&&(k.push(p),p=null),g=g.add(1,"d");v.append("g").selectAll("rect").data(k).enter().append("rect").attr("id",t=>e+"-exclude-"+t.start.format("YYYY-MM-DD")).attr("x",t=>T(t.start.startOf("day"))+n).attr("y",a.gridLineStartPadding).attr("width",t=>T(t.end.endOf("day"))-T(t.start.startOf("day"))).attr("height",o-i-a.gridLineStartPadding).attr("transform-origin",function(e,i){return(T(e.start)+n+.5*(T(e.end)-T(e.start))).toString()+"px "+(i*t+.5*o).toString()+"px"}).attr("class","exclude-range")}function _(t,e,i,s){if(i<=0||t>e)return 1/0;let n=d.duration({[s??"day"]:i}).asMilliseconds();return n<=0?1/0:Math.ceil((e-t)/n)}function W(t,e,i,n){let r;let o=s.db.getDateFormat();r=s.db.getAxisFormat()||("D"===o?"%d":a.axisFormat??"%Y-%m-%d");let l=(0,y.LLu)(T).tickSize(-n+e+a.gridLineStartPadding).tickFormat((0,y.i$Z)(r)),d=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(s.db.getTickInterval()||a.tickInterval);if(null!==d){let t=parseInt(d[1],10);if(isNaN(t)||t<=0)c.cM.warn(`Invalid tick interval value: "${d[1]}". Skipping custom tick interval.`);else{let e=d[2],i=s.db.getWeekday()||a.weekday,n=T.domain(),r=_(n[0],n[1],t,e);if(r>1e4)c.cM.warn(`The tick interval "${t}${e}" would generate ${r} ticks, which exceeds the maximum allowed (10000). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(e){case"millisecond":l.ticks(y.U8T.every(t));break;case"second":l.ticks(y.S1K.every(t));break;case"minute":l.ticks(y.Z_i.every(t));break;case"hour":l.ticks(y.WQD.every(t));break;case"day":l.ticks(y.rr1.every(t));break;case"week":l.ticks(tA[i].every(t));break;case"month":l.ticks(y.F0B.every(t))}}}if(v.append("g").attr("class","grid").attr("transform","translate("+t+", "+(n-50)+")").call(l).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),s.db.topAxisEnabled()||a.topAxis){let i=(0,y.F5q)(T).tickSize(-n+e+a.gridLineStartPadding).tickFormat((0,y.i$Z)(r));if(null!==d){let t=parseInt(d[1],10);if(isNaN(t)||t<=0)c.cM.warn(`Invalid tick interval value: "${d[1]}". Skipping custom tick interval.`);else{let e=d[2],n=s.db.getWeekday()||a.weekday,r=T.domain();if(1e4>=_(r[0],r[1],t,e))switch(e){case"millisecond":i.ticks(y.U8T.every(t));break;case"second":i.ticks(y.S1K.every(t));break;case"minute":i.ticks(y.Z_i.every(t));break;case"hour":i.ticks(y.WQD.every(t));break;case"day":i.ticks(y.rr1.every(t));break;case"week":i.ticks(tA[n].every(t));break;case"month":i.ticks(y.F0B.every(t))}}}v.append("g").attr("class","grid").attr("transform","translate("+t+", "+e+")").call(i).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}function D(t,e){let i=0,s=Object.keys(p).map(t=>[t,p[t]]);v.append("g").selectAll("text").data(s).enter().append(function(t){let e=t[0].split(o.SY.lineBreakRegex),i=-(e.length-1)/2,s=h.createElementNS("http://www.w3.org/2000/svg","text");for(let[t,n]of(s.setAttribute("dy",i+"em"),e.entries())){let e=h.createElementNS("http://www.w3.org/2000/svg","tspan");e.setAttribute("alignment-baseline","central"),e.setAttribute("x","10"),t>0&&e.setAttribute("dy","1em"),e.textContent=n,s.appendChild(e)}return s}).attr("x",10).attr("y",function(n,r){if(!(r>0))return n[1]*t/2+e;for(let a=0;a<r;a++)return i+=s[r-1][1],n[1]*t/2+i*t+e}).attr("font-size",a.sectionFontSize).attr("class",function(t){for(let[e,i]of k.entries())if(t[0]===i)return"sectionTitle sectionTitle"+e%a.numberSectionStyles;return"sectionTitle"})}function S(t,e,i,n){let r=s.db.getTodayMarker();if("off"===r)return;let o=v.append("g").attr("class","today"),c=new Date,l=o.append("line");l.attr("x1",T(c)+t).attr("x2",T(c)+t).attr("y1",a.titleTopMargin).attr("y2",n-a.titleTopMargin).attr("class","today"),""!==r&&l.attr("style",r.replace(/,/g,";"))}function C(t){let e={},i=[];for(let s=0,n=t.length;s<n;++s)Object.prototype.hasOwnProperty.call(e,t[s])||(e[t[s]]=!0,i.push(t[s]));return i}(0,c.eW)(x,"taskCompare"),m.sort(x),b(m,r,g),(0,o.v2)(v,g,r,a.useMaxWidth),v.append("text").text(s.db.getDiagramTitle()).attr("x",r/2).attr("y",a.titleTopMargin).attr("class","titleText"),(0,c.eW)(b,"makeGantt"),(0,c.eW)($,"drawRects"),(0,c.eW)(w,"drawExcludeDays"),(0,c.eW)(_,"getEstimatedTickCount"),(0,c.eW)(W,"makeGrid"),(0,c.eW)(D,"vertLabels"),(0,c.eW)(S,"drawToday"),(0,c.eW)(C,"checkUnique")},"draw")},styles:(0,c.eW)(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar \u2014 same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${t.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles")}}}]);