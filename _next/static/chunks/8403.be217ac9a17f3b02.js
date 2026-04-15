"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8403],{25925:function(e,t,i){function a(e,t){e.accDescr&&t.setAccDescription?.(e.accDescr),e.accTitle&&t.setAccTitle?.(e.accTitle),e.title&&t.setDiagramTitle?.(e.title)}i.d(t,{A:function(){return a}}),(0,i(35096).eW)(a,"populateCommonDb")},68403:function(e,t,i){i.d(t,{diagram:function(){return b}});var a=i(22971),l=i(25925),r=i(82436),n=i(92161),s=i(35096),o=i(12491),c=i(1251),p=n.vZ.pie,d={sections:new Map,showData:!1,config:p},u=d.sections,g=d.showData,f=structuredClone(p),h=(0,s.eW)(()=>structuredClone(f),"getConfig"),m=(0,s.eW)(()=>{u=new Map,g=d.showData,(0,n.ZH)()},"clear"),x=(0,s.eW)(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);u.has(e)||(u.set(e,t),s.cM.debug(`added new section: ${e}, with value: ${t}`))},"addSection"),w=(0,s.eW)(()=>u,"getSections"),$=(0,s.eW)(e=>{g=e},"setShowData"),S=(0,s.eW)(()=>g,"getShowData"),T={getConfig:h,clear:m,setDiagramTitle:n.g2,getDiagramTitle:n.Kr,setAccTitle:n.GN,getAccTitle:n.eu,setAccDescription:n.U$,getAccDescription:n.Mx,addSection:x,getSections:w,setShowData:$,getShowData:S},y=(0,s.eW)((e,t)=>{(0,l.A)(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},"populateDb"),C={parse:(0,s.eW)(async e=>{let t=await (0,o.Qc)("pie",e);s.cM.debug(t),y(t,T)},"parse")},D=(0,s.eW)(e=>`
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
`,"getStyles"),v=(0,s.eW)(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),i=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return(0,c.ve8)().value(e=>e.value).sort(null)(i)},"createPieArcs"),b={parser:C,db:T,renderer:{draw:(0,s.eW)((e,t,i,l)=>{s.cM.debug("rendering pie chart\n"+e);let o=l.db,p=(0,n.nV)(),d=(0,r.Rb)(o.getConfig(),p.pie),u=(0,a.P)(t),g=u.append("g");g.attr("transform","translate(225,225)");let{themeVariables:f}=p,[h]=(0,r.VG)(f.pieOuterStrokeWidth);h??=2;let m=d.textPosition,x=(0,c.Nb1)().innerRadius(0).outerRadius(185),w=(0,c.Nb1)().innerRadius(185*m).outerRadius(185*m);g.append("circle").attr("cx",0).attr("cy",0).attr("r",185+h/2).attr("class","pieOuterCircle");let $=o.getSections(),S=v($),T=[f.pie1,f.pie2,f.pie3,f.pie4,f.pie5,f.pie6,f.pie7,f.pie8,f.pie9,f.pie10,f.pie11,f.pie12],y=0;$.forEach(e=>{y+=e});let C=S.filter(e=>"0"!==(e.data.value/y*100).toFixed(0)),D=(0,c.PKp)(T).domain([...$.keys()]);g.selectAll("mySlices").data(C).enter().append("path").attr("d",x).attr("fill",e=>D(e.data.label)).attr("class","pieCircle"),g.selectAll("mySlices").data(C).enter().append("text").text(e=>(e.data.value/y*100).toFixed(0)+"%").attr("transform",e=>"translate("+w.centroid(e)+")").style("text-anchor","middle").attr("class","slice");let b=g.append("text").text(o.getDiagramTitle()).attr("x",0).attr("y",-200).attr("class","pieTitleText"),W=[...$.entries()].map(([e,t])=>({label:e,value:t})),k=g.selectAll(".legend").data(W).enter().append("g").attr("class","legend").attr("transform",(e,t)=>"translate(216,"+(22*t-22*W.length/2)+")");k.append("rect").attr("width",18).attr("height",18).style("fill",e=>D(e.label)).style("stroke",e=>D(e.label)),k.append("text").attr("x",22).attr("y",14).text(e=>o.getShowData()?`${e.label} [${e.value}]`:e.label);let A=Math.max(...k.selectAll("text").nodes().map(e=>e?.getBoundingClientRect().width??0)),M=b.node()?.getBoundingClientRect().width??0,R=Math.min(0,225-M/2),z=Math.max(512+A,225+M/2)-R;u.attr("viewBox",`${R} 0 ${z} 450`),(0,n.v2)(u,450,z,d.useMaxWidth)},"draw")},styles:D}}}]);