"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6865],{25925:function(e,t,a){function i(e,t){e.accDescr&&t.setAccDescription?.(e.accDescr),e.accTitle&&t.setAccTitle?.(e.accTitle),e.title&&t.setDiagramTitle?.(e.title)}a.d(t,{A:function(){return i}}),(0,a(35096).eW)(i,"populateCommonDb")},6865:function(e,t,a){a.d(t,{diagram:function(){return b}});var i=a(90779),l=a(25925),r=a(64348),n=a(22957),s=a(35096),c=a(12491),o=a(1251),p=n.vZ.pie,d={sections:new Map,showData:!1,config:p},u=d.sections,g=d.showData,f=structuredClone(p),h=(0,s.eW)(()=>structuredClone(f),"getConfig"),x=(0,s.eW)(()=>{u=new Map,g=d.showData,(0,n.ZH)()},"clear"),m=(0,s.eW)(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);u.has(e)||(u.set(e,t),s.cM.debug(`added new section: ${e}, with value: ${t}`))},"addSection"),w=(0,s.eW)(()=>u,"getSections"),$=(0,s.eW)(e=>{g=e},"setShowData"),S=(0,s.eW)(()=>g,"getShowData"),T={getConfig:h,clear:x,setDiagramTitle:n.g2,getDiagramTitle:n.Kr,setAccTitle:n.GN,getAccTitle:n.eu,setAccDescription:n.U$,getAccDescription:n.Mx,addSection:m,getSections:w,setShowData:$,getShowData:S},v=(0,s.eW)((e,t)=>{(0,l.A)(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},"populateDb"),y={parse:(0,s.eW)(async e=>{let t=await (0,c.Qc)("pie",e);s.cM.debug(t),v(t,T)},"parse")},D=(0,s.eW)(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),C=(0,s.eW)(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),a=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1).sort((e,t)=>t.value-e.value);return(0,o.ve8)().value(e=>e.value)(a)},"createPieArcs"),b={parser:y,db:T,renderer:{draw:(0,s.eW)((e,t,a,l)=>{s.cM.debug("rendering pie chart\n"+e);let c=l.db,p=(0,n.nV)(),d=(0,r.Rb)(c.getConfig(),p.pie),u=(0,i.P)(t),g=u.append("g");g.attr("transform","translate(225,225)");let{themeVariables:f}=p,[h]=(0,r.VG)(f.pieOuterStrokeWidth);h??=2;let x=d.textPosition,m=(0,o.Nb1)().innerRadius(0).outerRadius(185),w=(0,o.Nb1)().innerRadius(185*x).outerRadius(185*x);g.append("circle").attr("cx",0).attr("cy",0).attr("r",185+h/2).attr("class","pieOuterCircle");let $=c.getSections(),S=C($),T=[f.pie1,f.pie2,f.pie3,f.pie4,f.pie5,f.pie6,f.pie7,f.pie8,f.pie9,f.pie10,f.pie11,f.pie12],v=0;$.forEach(e=>{v+=e});let y=S.filter(e=>"0"!==(e.data.value/v*100).toFixed(0)),D=(0,o.PKp)(T);g.selectAll("mySlices").data(y).enter().append("path").attr("d",m).attr("fill",e=>D(e.data.label)).attr("class","pieCircle"),g.selectAll("mySlices").data(y).enter().append("text").text(e=>(e.data.value/v*100).toFixed(0)+"%").attr("transform",e=>"translate("+w.centroid(e)+")").style("text-anchor","middle").attr("class","slice"),g.append("text").text(c.getDiagramTitle()).attr("x",0).attr("y",-200).attr("class","pieTitleText");let b=[...$.entries()].map(([e,t])=>({label:e,value:t})),W=g.selectAll(".legend").data(b).enter().append("g").attr("class","legend").attr("transform",(e,t)=>"translate(216,"+(22*t-22*b.length/2)+")");W.append("rect").attr("width",18).attr("height",18).style("fill",e=>D(e.label)).style("stroke",e=>D(e.label)),W.append("text").attr("x",22).attr("y",14).text(e=>c.getShowData()?`${e.label} [${e.value}]`:e.label);let k=512+Math.max(...W.selectAll("text").nodes().map(e=>e?.getBoundingClientRect().width??0));u.attr("viewBox",`0 0 ${k} 450`),(0,n.v2)(u,450,k,d.useMaxWidth)},"draw")},styles:D}}}]);