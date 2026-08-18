(function(){
  const staffRoot=document.getElementById('bathStaff');
  if(!staffRoot)return;

  const num=el=>Number(el?.value)||0;

  function syncDrive(card,recalc=true){
    const toggle=card.querySelector('.staff-drive-auto');
    const driveCases=card.querySelector('.staff-drive-cases');
    if(!toggle||!driveCases)return;
    const totalCases=num(card.querySelector('.staff-cases60'))+num(card.querySelector('.staff-cases40'));
    driveCases.value=toggle.checked?totalCases:0;
    if(recalc&&typeof calcBath==='function')calcBath();
  }

  function enhance(card){
    if(!card||card.dataset.driveAutoReady==='1')return;
    const driveCases=card.querySelector('.staff-drive-cases');
    if(!driveCases)return;
    card.dataset.driveAutoReady='1';

    const driveField=driveCases.closest('.field');
    const driveGrid=driveField?.parentElement;
    const driveLabel=driveField?.querySelector('label');
    if(driveLabel)driveLabel.textContent='운전 건수 (자동)';
    driveCases.readOnly=true;
    driveCases.tabIndex=-1;
    driveCases.style.background='#f3f6f9';

    if(driveGrid){
      driveGrid.classList.remove('grid3');
      driveGrid.classList.add('grid2');
      const toggleField=document.createElement('div');
      toggleField.className='field';
      toggleField.innerHTML=`<label>운전 담당</label><label style="min-height:45px;border:1px solid #cfd7e2;background:#fff;border-radius:11px;padding:10px 12px;display:flex;align-items:center;gap:9px;cursor:pointer"><input class="staff-drive-auto" type="checkbox" style="width:20px;height:20px;min-height:20px;margin:0"><span style="font-size:14px;font-weight:850;color:#334155">이 선생님이 운전</span></label>`;
      driveGrid.insertBefore(toggleField,driveField);
    }

    const toggle=card.querySelector('.staff-drive-auto');
    toggle.checked=num(driveCases)>0;
    toggle.addEventListener('change',()=>syncDrive(card,true));
    card.querySelector('.staff-cases60')?.addEventListener('input',()=>syncDrive(card,true));
    card.querySelector('.staff-cases40')?.addEventListener('input',()=>syncDrive(card,true));
    syncDrive(card,false);
  }

  function enhanceAll(){staffRoot.querySelectorAll('.bath-staff-card').forEach(enhance);}
  enhanceAll();

  new MutationObserver(()=>{
    enhanceAll();
    if(typeof calcBath==='function')calcBath();
  }).observe(staffRoot,{childList:true});
})();
