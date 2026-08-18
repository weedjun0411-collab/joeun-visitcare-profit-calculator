const fees={30:17450,60:25320,90:34120,120:43430,150:50640,180:57020,210:63530,240:70080};
let clientSeq=0;
const $=id=>document.getElementById(id);
const won=n=>Math.round(Number(n)||0).toLocaleString('ko-KR')+'원';
const nval=el=>Number(el?.value)||0;

function scheduleRow(min=180,count=20){
  const row=document.createElement('div');
  row.className='schedule-row';
  row.innerHTML=`
    <div class="field" style="margin:0"><label>방문시간</label><select class="mins">${Object.keys(fees).map(m=>`<option value="${m}" ${Number(m)===min?'selected':''}>${m}분 · ${fees[m].toLocaleString()}원</option>`).join('')}</select></div>
    <div class="field" style="margin:0"><label>횟수</label><div class="input-wrap has-suffix"><input class="count" type="number" min="0" value="${count}"><span class="suffix">회</span></div></div>
    <button class="remove remove-row" type="button" aria-label="일정 삭제">×</button>`;
  return row;
}

function clientTemplate(id,opts={}){
  const card=document.createElement('section');
  card.className='client-card';
  card.dataset.client=id;
  card.dataset.mode=opts.mode||'auto';
  card.innerHTML=`
    <div class="client-head">
      <div class="client-title"><span>어르신 ${id}</span> 손익</div>
      <button class="delete-client" type="button">어르신 삭제</button>
    </div>
    <div class="field">
      <label>어르신 이름 <span style="font-weight:500;color:#94a3b8">(선택)</span></label>
      <input class="client-name" type="text" placeholder="예: 홍길동" value="${opts.name||''}">
    </div>
    <div class="section-label">청구금액</div>
    <div class="segment">
      <button class="mode-auto active" type="button">시간 × 횟수 자동계산</button>
      <button class="mode-manual" type="button">청구금액 직접입력</button>
    </div>
    <div class="auto-area">
      <div class="schedule-rows"></div>
      <button class="add add-row" type="button">+ 일정 추가</button>
      <div class="summary-line"><span>근무시간</span><strong class="auto-hours">0시간</strong></div>
      <div class="summary-line"><span>예상 청구금액</span><strong class="auto-revenue">0원</strong></div>
    </div>
    <div class="manual-area hidden">
      <div class="grid2">
        <div class="field"><label>청구금액</label><div class="input-wrap has-suffix"><input class="manual-revenue" type="number" min="0" value="${opts.manualRevenue||0}"><span class="suffix">원</span></div></div>
        <div class="field"><label>총 근무시간</label><div class="input-wrap has-suffix"><input class="manual-hours" type="number" min="0" step="0.1" value="${opts.manualHours||0}"><span class="suffix">시간</span></div></div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="section-label">이 어르신 급여조건</div>
    <div class="grid2">
      <div class="field"><label>통상시급</label><div class="input-wrap has-suffix"><input class="hourly" type="number" min="0" value="${opts.hourly??13500}"><span class="suffix">원</span></div></div>
      <div class="field"><label>교통비</label><div class="input-wrap has-suffix"><input class="transport" type="number" min="0" value="${opts.transport||0}"><span class="suffix">원</span></div></div>
      <div class="field"><label>식대</label><div class="input-wrap has-suffix"><input class="meal" type="number" min="0" value="${opts.meal||0}"><span class="suffix">원</span></div></div>
      <div class="field"><label>기타 추가금</label><div class="input-wrap has-suffix"><input class="extra" type="number" min="0" value="${opts.extra||0}"><span class="suffix">원</span></div></div>
    </div>
    <div class="client-summary">
      <div class="mini"><div class="k">청구금액</div><div class="v client-revenue">0원</div></div>
      <div class="mini"><div class="k">지급 급여</div><div class="v client-salary">0원</div></div>
      <div class="mini"><div class="k">청구 - 급여</div><div class="v client-gap">0원</div></div>
    </div>`;
  const rows=card.querySelector('.schedule-rows');
  (opts.schedules||[{min:180,count:20}]).forEach(s=>rows.appendChild(scheduleRow(s.min,s.count)));
  if((opts.mode||'auto')==='manual') setClientMode(card,'manual',false);
  return card;
}

function addClient(opts={}){
  clientSeq++;
  const card=clientTemplate(clientSeq,opts);
  $('clients').appendChild(card);
  updateClientNumbers();
  calc();
}

function updateClientNumbers(){
  const cards=[...document.querySelectorAll('.client-card')];
  cards.forEach((card,i)=>{
    const title=card.querySelector('.client-title span');
    title.textContent=`어르신 ${i+1}`;
    card.querySelector('.delete-client').classList.toggle('hidden',cards.length===1);
  });
  $('clientCount').value=cards.length; $('headerClientCount').textContent=cards.length+'명';
}

function setClientMode(card,mode,runCalc=true){
  card.dataset.mode=mode;
  card.querySelector('.mode-auto').classList.toggle('active',mode==='auto');
  card.querySelector('.mode-manual').classList.toggle('active',mode==='manual');
  card.querySelector('.auto-area').classList.toggle('hidden',mode!=='auto');
  card.querySelector('.manual-area').classList.toggle('hidden',mode!=='manual');
  if(runCalc) calc();
}

function getAuto(card){
  let revenue=0,minutes=0;
  card.querySelectorAll('.schedule-row').forEach(r=>{
    const m=nval(r.querySelector('.mins'));
    const c=nval(r.querySelector('.count'));
    revenue+=(fees[m]||0)*c;
    minutes+=m*c;
  });
  return {revenue,hours:minutes/60};
}

function clientValues(card){
  const auto=getAuto(card);
  card.querySelector('.auto-hours').textContent=(Math.round(auto.hours*10)/10).toLocaleString('ko-KR')+'시간';
  card.querySelector('.auto-revenue').textContent=won(auto.revenue);
  const manual=card.dataset.mode==='manual';
  const revenue=manual?nval(card.querySelector('.manual-revenue')):auto.revenue;
  const hours=manual?nval(card.querySelector('.manual-hours')):auto.hours;
  const salary=hours*nval(card.querySelector('.hourly'))+nval(card.querySelector('.transport'))+nval(card.querySelector('.meal'))+nval(card.querySelector('.extra'));
  const gap=revenue-salary;
  card.querySelector('.client-revenue').textContent=won(revenue);
  card.querySelector('.client-salary').textContent=won(salary);
  const gapEl=card.querySelector('.client-gap');
  gapEl.textContent=won(gap);
  gapEl.style.color=gap<0?'#b91c1c':'#0f766e';
  return {revenue,hours,salary};
}

function insuranceAmount(base){
  const defs=[['pensionChk','pensionRate'],['healthChk','healthRate'],['employmentChk','employmentRate'],['accidentChk','accidentRate']];
  return defs.reduce((sum,[c,r])=>sum+($(c).checked?base*(nval($(r))/100):0),0);
}

function calc(){
  let revenue=0,salary=0;
  document.querySelectorAll('.client-card').forEach(card=>{
    const v=clientValues(card);
    revenue+=v.revenue;
    salary+=v.salary;
  });
  const insurance=insuranceAmount(salary);
  const severance=$('severanceChk').checked?salary*(nval($('severanceRate'))/100):0;
  const profit=revenue-salary-insurance-severance;
  const margin=revenue>0?profit/revenue*100:0;
  $('salaryPreview').textContent=won(salary);
  $('insurancePreview').textContent=won(insurance);
  $('severancePreview').textContent=won(severance);
  $('rRevenue').textContent=won(revenue);
  $('rSalary').textContent=won(salary);
  $('rInsurance').textContent=won(insurance);
  $('rSeverance').textContent=won(severance);
  $('rProfit').textContent=won(profit);
  $('rProfit').style.color=profit<0?'#b91c1c':'#0f766e';
  $('rMargin').textContent=margin.toFixed(1)+'%';
  $('headerRevenue').textContent=won(revenue);
  $('headerProfit').textContent=won(profit);
  $('headerProfit').style.color=profit<0?'#fecaca':'#fff';
}

$('clients').addEventListener('click',e=>{
  const card=e.target.closest('.client-card');
  if(!card) return;
  if(e.target.closest('.mode-auto')) setClientMode(card,'auto');
  if(e.target.closest('.mode-manual')) setClientMode(card,'manual');
  if(e.target.closest('.add-row')){card.querySelector('.schedule-rows').appendChild(scheduleRow(180,1));calc();}
  if(e.target.closest('.remove-row')){e.target.closest('.schedule-row').remove();calc();}
  if(e.target.closest('.delete-client')){card.remove();updateClientNumbers();calc();}
});
$('clients').addEventListener('input',calc);
$('clients').addEventListener('change',calc);
$('addClientBtn').addEventListener('click',()=>addClient({schedules:[{min:180,count:1}]}));
['pensionRate','healthRate','employmentRate','accidentRate','severanceRate'].forEach(id=>$(id).addEventListener('input',calc));
['pensionChk','healthChk','employmentChk','accidentChk','severanceChk'].forEach(id=>$(id).addEventListener('change',calc));

$('resetBtn').addEventListener('click',()=>{
  $('caregiverName').value='';
  $('clients').innerHTML='';clientSeq=0;
  addClient({schedules:[{min:180,count:20}],hourly:13500});
  $('pensionChk').checked=$('healthChk').checked=$('employmentChk').checked=$('accidentChk').checked=$('severanceChk').checked=true;
  $('pensionRate').value=4.75;$('healthRate').value=4.0674;$('employmentRate').value=0.9;$('accidentRate').value=0.7;$('severanceRate').value=8.33;
  calc();
});

$('sampleBtn').addEventListener('click',()=>{
  $('caregiverName').value='김영희';
  $('clients').innerHTML='';clientSeq=0;
  addClient({name:'박철수',schedules:[{min:180,count:20}],hourly:13500,transport:50000});
  addClient({name:'이영자',schedules:[{min:180,count:12},{min:240,count:4}],hourly:14000,transport:80000,extra:30000});
  addClient({name:'최순자',mode:'manual',manualRevenue:720000,manualHours:42,hourly:14500,meal:50000});
  calc();
});

addClient({schedules:[{min:180,count:20}],hourly:13500});
calc();