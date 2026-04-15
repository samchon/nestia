"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4681],{25925:function(t,e,a){function r(t,e){t.accDescr&&e.setAccDescription?.(t.accDescr),t.accTitle&&e.setAccTitle?.(t.accTitle),t.title&&e.setDiagramTitle?.(t.title)}a.d(e,{A:function(){return r}}),(0,a(35096).eW)(r,"populateCommonDb")},74681:function(t,e,a){a.d(e,{diagram:function(){return g}});var r=a(22971),i=a(25925),l=a(82436),o=a(92161),s=a(35096),n=a(12491),c=o.vZ.packet,d=class{constructor(){this.packet=[],this.setAccTitle=o.GN,this.getAccTitle=o.eu,this.setDiagramTitle=o.g2,this.getDiagramTitle=o.Kr,this.getAccDescription=o.Mx,this.setAccDescription=o.U$}static{(0,s.eW)(this,"PacketDB")}getConfig(){let t=(0,l.Rb)({...c,...(0,o.iE)().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){(0,o.ZH)(),this.packet=[]}},p=(0,s.eW)((t,e)=>{(0,i.A)(t,e);let a=-1,r=[],l=1,{bitsPerRow:o}=e.getConfig();for(let{start:i,end:n,bits:c,label:d}of t.blocks){if(void 0!==i&&void 0!==n&&n<i)throw Error(`Packet block ${i} - ${n} is invalid. End must be greater than start.`);if((i??=a+1)!==a+1)throw Error(`Packet block ${i} - ${n??i} is not contiguous. It should start from ${a+1}.`);if(0===c)throw Error(`Packet block ${i} is invalid. Cannot have a zero bit field.`);for(n??=i+(c??1)-1,c??=n-i+1,a=n,s.cM.debug(`Packet block ${i} - ${a} with label ${d}`);r.length<=o+1&&e.getPacket().length<1e4;){let[t,a]=k({start:i,end:n,bits:c,label:d},l,o);if(r.push(t),t.end+1===l*o&&(e.pushWord(r),r=[],l++),!a)break;({start:i,end:n,bits:c,label:d}=a)}}e.pushWord(r)},"populate"),k=(0,s.eW)((t,e,a)=>{if(void 0===t.start)throw Error("start should have been set during first phase");if(void 0===t.end)throw Error("end should have been set during first phase");if(t.start>t.end)throw Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*a)return[t,void 0];let r=e*a-1,i=e*a;return[{start:t.start,end:r,label:t.label,bits:r-t.start},{start:i,end:t.end,label:t.label,bits:t.end-i}]},"getNextFittingBlock"),h={parser:{yy:void 0},parse:(0,s.eW)(async t=>{let e=await (0,n.Qc)("packet",t),a=h.parser?.yy;if(!(a instanceof d))throw Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");s.cM.debug(e),p(e,a)},"parse")},b=(0,s.eW)((t,e,a,i)=>{let l=i.db,s=l.getConfig(),{rowHeight:n,paddingY:c,bitWidth:d,bitsPerRow:p}=s,k=l.getPacket(),h=l.getDiagramTitle(),b=n+c,f=b*(k.length+1)-(h?0:n),g=d*p+2,y=(0,r.P)(e);for(let[t,e]of(y.attr("viewBox",`0 0 ${g} ${f}`),(0,o.v2)(y,f,g,s.useMaxWidth),k.entries()))u(y,e,t,s);y.append("text").text(h).attr("x",g/2).attr("y",f-b/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),u=(0,s.eW)((t,e,a,{rowHeight:r,paddingX:i,paddingY:l,bitWidth:o,bitsPerRow:s,showBits:n})=>{let c=t.append("g"),d=a*(r+l)+l;for(let t of e){let e=t.start%s*o+1,a=(t.end-t.start+1)*o-i;if(c.append("rect").attr("x",e).attr("y",d).attr("width",a).attr("height",r).attr("class","packetBlock"),c.append("text").attr("x",e+a/2).attr("y",d+r/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(t.label),!n)continue;let l=t.end===t.start,p=d-2;c.append("text").attr("x",e+(l?a/2:0)).attr("y",p).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",l?"middle":"start").text(t.start),l||c.append("text").attr("x",e+a).attr("y",p).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(t.end)}},"drawWord"),f={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},g={parser:h,get db(){return new d},renderer:{draw:b},styles:(0,s.eW)(({packet:t}={})=>{let e=(0,l.Rb)(f,t);return`
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles")}}}]);