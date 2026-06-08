/* ── TYPEWRITER ── */
(function(){
  const words=['Front-End Developer','UI Enthusiast','BSIT Student','Intern Ready'];
  let wi=0,ci=0,del=false,pause=0;
  const el=document.getElementById('typewriter');
  function tick(){
    if(pause>0){pause--;setTimeout(tick,80);return;}
    const w=words[wi];
    if(!del){
      el.textContent=w.slice(0,++ci);
      if(ci===w.length){del=true;pause=30;}
      setTimeout(tick,90);
    } else {
      el.textContent=w.slice(0,--ci);
      if(ci===0){del=false;wi=(wi+1)%words.length;pause=8;}
      setTimeout(tick,50);
    }
  }
  tick();
})();

/* ── SCROLL EVENTS ── */
const scrollBtn=document.getElementById('scrollBtn');
const backTop=document.getElementById('backTop');
window.addEventListener('scroll',()=>{
  const y=window.scrollY;
  scrollBtn.style.opacity=y>100?'0':'1';
  scrollBtn.style.pointerEvents=y>100?'none':'auto';
  if(y>400)backTop.classList.add('show');
  else backTop.classList.remove('show');
});

/* ── INTERSECTION OBSERVER ── */
const io=new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      setTimeout(()=>e.target.classList.add('in'),i*60);
    }
  });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ── SKILL BAR ANIMATION ── */
const barObs=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.querySelectorAll('.sbar-fill').forEach(b=>b.classList.add('animate'));
      barObs.unobserve(e.target);
    }
  });
},{threshold:0.3});
document.querySelectorAll('.skill-bars').forEach(el=>barObs.observe(el));

/* ── MOBILE MENU ── */
function toggleMenu(){
  const m=document.getElementById('mob-menu');
  const h=document.getElementById('ham');
  m.classList.toggle('show');
  h.classList.toggle('open');
}
function closeMenu(){
  document.getElementById('mob-menu').classList.remove('show');
  document.getElementById('ham').classList.remove('open');
}

/* ── ACTIVE NAV HIGHLIGHT ── */
const sections=document.querySelectorAll('section[id],footer[id]');
const navAs=document.querySelectorAll('.nav-links a');
function updateNav(){
  let cur='';
  sections.forEach(s=>{
    if(window.scrollY>=s.offsetTop-120) cur=s.id;
  });
  navAs.forEach(a=>{
    const isActive = a.getAttribute('href')==='#'+cur;
    a.classList.toggle('nav-active', isActive);
  });
}
window.addEventListener('scroll', updateNav, {passive:true});
updateNav();

/* ── FORM VALIDATION HELPERS ── */
function showError(fieldId, msg){
  const field = document.getElementById(fieldId);
  field.classList.add('input-error');
  let err = field.parentNode.querySelector('.field-error');
  if(!err){ err = document.createElement('span'); err.className='field-error'; field.parentNode.appendChild(err); }
  err.textContent = msg;
}
function clearError(fieldId){
  const field = document.getElementById(fieldId);
  field.classList.remove('input-error');
  const err = field.parentNode.querySelector('.field-error');
  if(err) err.textContent = '';
}
function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function isValidName(name){
  // Only letters, spaces, hyphens, apostrophes — no numbers or symbols
  return /^[a-zA-Z\s'\-]{2,60}$/.test(name);
}
function containsSpam(text){
  const spamPatterns = /http[s]?:\/\/|www\.|<script|onclick|viagra|casino|crypto|click here|free money|earn \$|make money fast/i;
  return spamPatterns.test(text);
}

// Clear errors on input
['msgName','msgEmail','msgBody'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=> clearError(id));
});

/* ── RATE LIMIT (max 3 submissions per 10 min) ── */
function checkRateLimit(){
  const now = Date.now();
  const key = 'form_submissions';
  let submissions = JSON.parse(sessionStorage.getItem(key) || '[]');
  submissions = submissions.filter(t => now - t < 10 * 60 * 1000); // keep last 10 min
  if(submissions.length >= 3) return false;
  submissions.push(now);
  sessionStorage.setItem(key, JSON.stringify(submissions));
  return true;
}

/* ── CONTACT FORM ── */
document.getElementById('contactForm').addEventListener('submit', async function(e){
  e.preventDefault();

  const name    = document.getElementById('msgName').value.trim();
  const email   = document.getElementById('msgEmail').value.trim();
  const message = document.getElementById('msgBody').value.trim();

  // Clear previous errors
  ['msgName','msgEmail','msgBody'].forEach(clearError);
  let valid = true;

  // Name validation
  if(!name){
    showError('msgName', 'Please enter your name.'); valid = false;
  } else if(!isValidName(name)){
    showError('msgName', 'Name should only contain letters (2–60 characters).'); valid = false;
  }

  // Email validation
  if(!email){
    showError('msgEmail', 'Please enter your email.'); valid = false;
  } else if(!isValidEmail(email)){
    showError('msgEmail', 'Please enter a valid email address.'); valid = false;
  }

  // Message validation
  if(!message){
    showError('msgBody', 'Please write a message.'); valid = false;
  } else if(message.length < 10){
    showError('msgBody', 'Message is too short (minimum 10 characters).'); valid = false;
  } else if(message.length > 2000){
    showError('msgBody', 'Message is too long (maximum 2000 characters).'); valid = false;
  } else if(containsSpam(message) || containsSpam(name)){
    showError('msgBody', 'Message contains disallowed content.'); valid = false;
  }

  if(!valid) return;

  // Rate limit check
  if(!checkRateLimit()){
    showError('msgBody', 'Too many submissions. Please wait a few minutes before trying again.');
    return;
  }

  // ── SEND VIA FORMSPREE ──
  // Replace the action URL below with your Formspree endpoint after signing up at formspree.io
  const FORMSPREE_URL = 'https://formspree.io/f/maqzooak';

  const btn = document.querySelector('.msg-send-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg> Sending…`;

  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });

    if(res.ok){
      document.getElementById('msgSuccess').classList.add('show');
      document.getElementById('contactForm').reset();
      setTimeout(()=>document.getElementById('msgSuccess').classList.remove('show'), 6000);
    } else {
      const data = await res.json();
      showError('msgBody', data?.errors?.[0]?.message || 'Something went wrong. Please try again.');
    }
  } catch(err){
    showError('msgBody', 'Network error. Please check your connection and try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Message`;
  }
});