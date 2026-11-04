// Real Selenium UI verification. This runner creates and removes its own database.
import { Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { Select } from 'selenium-webdriver/lib/select.js';
import mongoose from 'mongoose';
import nextEnv from '@next/env';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import dns from 'node:dns';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

nextEnv.loadEnvConfig(process.cwd());
const base = 'http://localhost:3106';
const build = process.env.E_SIKHO_BUILD_DIR || '.next-assessment-audit';
const out = path.resolve(process.env.SELENIUM_RESULTS_DIR || 'audit-local/selenium-results');
const databaseName = 'e_sikho_selenium_test_' + crypto.randomBytes(6).toString('hex');
const password = crypto.randomBytes(16).toString('base64url') + '!';
const uri = new URL(process.env.MONGODB_URI); uri.pathname = '/' + databaseName;
process.env.SE_CACHE_PATH ||= path.resolve('audit-local/selenium-cache');
process.env.SE_AVOID_STATS = 'true';
const data = {
  runId: 'selenium-' + new Date().toISOString().replace(/[:.]/g, '-'), startedAt: new Date().toISOString(),
  timezone: 'Asia/Dhaka', framework: 'Selenium WebDriver', seleniumVersion: createRequire(import.meta.url)('selenium-webdriver/package.json').version,
  method: 'Headless Chrome controlled by real Selenium WebDriver. UI interactions use WebDriver. Real Auth.js credentials endpoints prepare fixture sessions; delivered SMS/OTP login is not claimed. MongoDB reads verify persistence. No application/network mocks.',
  branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  uncommittedFixes: true, nodeVersion: process.version, platform: process.platform, baseURL: base, results: [], databaseRemoved: false, temporaryPdfRemoved: false,
};
const selectedCases = (process.env.SELENIUM_CASES || '').split(',').filter(Boolean);
const runDemoCheckout = selectedCases.length === 0 || selectedCases.includes('SEL-29');
let connection, server, driver, serverLog, pdfPath, currentActor;
const users = {}, courses = {};
const id = value => new mongoose.Types.ObjectId(value);
const col = name => connection.db.collection(name);
const quote = value => value.includes("'") ? `concat('${value.split("'").join("',\"'\",'")}')` : `'${value}'`;
const exact = text => By.xpath(`//*[normalize-space(.)=${quote(text)}]`);
const button = text => By.xpath(`//button[normalize-space(.)=${quote(text)}]`);
const save = () => fs.writeFile(path.join(out, 'results.json'), JSON.stringify(data, null, 2));
function pdfFixture() {
  const content='BT /F1 18 Tf 72 720 Td (Selenium PDF verification resource) Tj ET';
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf='%PDF-1.4\n';const offsets=[0];
  for(const [index,object] of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;}
  const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('');
  return Buffer.from(pdf+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
class Blocked extends Error {}
async function visible(locator, timeout = 15000) {
  return driver.wait(async () => {
    for (const element of await driver.findElements(locator)) {
      try { if (await element.isDisplayed()) return element; } catch { /* Retry a React replacement. */ }
    }
    return false;
  }, timeout, 'Visible control was not found: ' + locator);
}
async function click(locator) { const element = await visible(locator); await element.click(); }
async function fill(locator, value) { const element = await visible(locator); await element.clear(); if (value) await element.sendKeys(value); }
async function label(text) {
  const element = await visible(By.xpath(`//*[@aria-label=${quote(text)}] | //label[normalize-space(text()[1])=${quote(text)} or normalize-space(.)=${quote(text)}]`));
  if (await element.getTagName() !== 'label') return element;
  const target = await element.getAttribute('for');
  if (target) return visible(By.id(target));
  const nested = await element.findElements(By.css('input,select,textarea'));
  if (nested.length) return nested[0];
  const sibling = await element.findElement(By.xpath('./following-sibling::*[1]'));
  if (['input', 'select', 'textarea'].includes(await sibling.getTagName())) return sibling;
  return sibling.findElement(By.css('input,select,textarea'));
}
async function fillLabel(text, value) {
  const element = await label(text);
  if (await element.getAttribute('type') === 'datetime-local') {
    // Chrome exposes segmented native date controls; keep the React form's input event intact.
    await driver.executeScript(function (input, date) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, date);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, element, value);
    assert.equal(await element.getAttribute('value'), value);
    return;
  }
  await element.clear(); await element.sendKeys(value);
}
async function selectLabel(text, value) { await new Select(await label(text)).selectByValue(value); }
async function hasText(text, timeout = 15000) { await driver.wait(async () => (await driver.findElement(By.css('body')).getText()).includes(text), timeout, 'Missing visible text: ' + text); }
async function noText(text) { assert(!(await driver.findElement(By.css('body')).getText()).includes(text), 'Unexpected visible text: ' + text); }
async function goto(route) { await driver.get(base + route); await driver.wait(async () => await driver.executeScript('return document.readyState') === 'complete', 15000); }
async function actor(key) {
  if (currentActor === key) return;
  // A JSON page has no React session requests that could overwrite a newly signed-in cookie.
  await goto('/api/auth/csrf'); await driver.manage().deleteAllCookies();
  await driver.executeScript("localStorage.setItem('esikho_language','en'); sessionStorage.clear();");
  if (key !== 'anon') {
    const result = await driver.executeAsyncScript(function (email, secret, done) {
      (async () => {
        const csrf = await (await fetch('/api/auth/csrf')).json();
        await fetch('/api/auth/callback/credentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, email, password: secret, callbackUrl: location.origin + '/' }) });
        const session = await (await fetch('/api/auth/session')).json();
        done({ id: session.user?.id, role: session.user?.role });
      })().catch(error => done({ error: error.message }));
    }, users[key].email, password);
    assert.equal(result.id, users[key].id, `Real fixture authentication failed for ${key}.`);
    assert.equal(result.role, users[key].role);
  }
  currentActor = key;
}
async function dbWait(fn, message) { return driver.wait(fn, 15000, message); }
async function run(caseId, title, planIds, expected, fn) {
  if (selectedCases.length && !selectedCases.includes(caseId)) return;
  const row = { id: caseId, title, planIds, expected, status: 'Not Run', startedAt: new Date().toISOString() };
  try { row.actual = await fn(); row.status = 'Pass'; }
  catch (error) {
    row.status = error instanceof Blocked ? 'Blocked' : 'Fail';
    let message = String(error.message || error);
    for (const secret of [process.env.MONGODB_URI, process.env.AUTH_SECRET, process.env.BUNNY_STREAM_API_KEY, process.env.BUNNY_STREAM_TOKEN_KEY, password].filter(Boolean)) message = message.replaceAll(secret, '[redacted]');
    row.actual = message.slice(0, 1500);
  }
  row.finishedAt = new Date().toISOString();
  row.durationSeconds = Number(((new Date(row.finishedAt) - new Date(row.startedAt)) / 1000).toFixed(2));
  if (driver && row.status !== 'Blocked') {
    try { row.screenshot = caseId + '.png'; await fs.writeFile(path.join(out, row.screenshot), await driver.takeScreenshot(), 'base64'); } catch { /* Preserve the assertion result if screenshot capture fails. */ }
  }
  data.results.push(row); await save(); console.log(`${caseId} ${row.status}: ${row.title}`);
  if (row.status === 'Fail') console.log(row.actual.slice(0, 220));
}
async function setup() {
  await fs.mkdir(out, { recursive: true });
  await fs.access(path.join(build, 'BUILD_ID')).catch(() => { throw new Error('Build the isolated application first: E_SIKHO_BUILD_DIR=.next-assessment-audit npm run build'); });
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  connection = await mongoose.createConnection(uri.toString(), { autoIndex: false, serverSelectionTimeoutMS: 10000 }).asPromise();
  const specs = [['teacher','Selenium Teacher','INSTRUCTOR','',''],['other','Other Selenium Teacher','INSTRUCTOR','',''],['admin','Selenium Superadmin','SUPERADMIN','',''],['school','School Selenium Learner','STUDENT','SCHOOL','Science'],['college','College Selenium Learner','STUDENT','COLLEGE','Science'],['university','University Selenium Learner','STUDENT','UNIVERSITY','CSE'],['outsider','EEE Selenium Learner','STUDENT','UNIVERSITY','EEE']];
  if (runDemoCheckout) specs.push(['purchaseAdmin','Selenium Purchase Admin','ADMIN','','']);
  for (const [key,name,role,educationLevel,department] of specs) {
    const _id = id(), salt = crypto.randomBytes(16).toString('hex');
    const record = { _id, name, role, status:'APPROVED', email:key.toLowerCase()+'@selenium-fixture.test', password:salt+':'+crypto.scryptSync(password,salt,64).toString('hex'), department, educationLevel:educationLevel||undefined, image:'', createdAt:new Date(), updatedAt:new Date() };
    await col('users').insertOne(record); users[key] = { id:String(_id), email:record.email, role };
  }
  const courseSpecs = [['published','Selenium Published Course','teacher','PUBLISHED'],['draft','Selenium Draft Course','teacher','DRAFT'],['foreign','Other Selenium Course','other','PUBLISHED'],['revision','Selenium Revision Course','teacher','PUBLISHED']];
  if (runDemoCheckout) courseSpecs.push(['demoPaid','Selenium Demo Paid Course','other','PUBLISHED',500]);
  for (const [key,title,owner,status,price=0] of courseSpecs) {
    const _id = id(), instructor = id();
    await col('instructors').insertOne({ _id:instructor,name:owner+' Selenium Instructor',role:'Instructor',bio:'Disposable Selenium fixture',avatar:'/images/avatar-placeholder.svg' });
    await col('courses').insertOne({ _id,title,titleEn:title,tagline:'Disposable Selenium verification',description:'Disposable Selenium verification',category:'programming',categoryBangla:'Programming',level:'Beginner',price,originalPrice:price,rating:0,totalRatings:0,studentsEnrolled:0,duration:'1 hour',totalLessons:key==='published'?2:0,thumbnailUrl:'/favicon.ico',status,approvalStatus:'APPROVED',createdById:id(users[owner].id),instructorId:instructor,instructorUserIds:[],learningOutcomes:'[]',prerequisites:'[]',allowRevisionAccess:true,revisionAccessDays:7,createdAt:new Date(),updatedAt:new Date() }); courses[key]=String(_id);
  }
  pdfPath=path.resolve('public','selenium-test-resource-'+crypto.randomBytes(6).toString('hex')+'.pdf');
  await fs.writeFile(pdfPath,pdfFixture());
  const moduleId=id(); await col('modules').insertOne({ _id:moduleId,courseId:id(courses.published),title:'Selenium module',duration:'1 hour',order:0 });
  for(const [key,title,isFree] of [['preview','Selenium Preview Lesson',true],['private','Selenium Private Lesson',false]]) {
    const _id=id();await col('lessons').insertOne({ _id,moduleId,title,content:'Disposable lesson content',duration:'01:00',type:'PDF',isFree,order:isFree?0:1,pdfUrl:'/'+path.basename(pdfPath),pdfName:title+' PDF',videoUrl:'' });courses[key]=String(_id);
  }
  await col('enrollments').insertMany([{ userId:id(users.university.id),courseId:courses.published,paymentStatus:'GRANTED',amountPaid:0 },{ userId:id(users.school.id),courseId:courses.revision,paymentStatus:'GRANTED',amountPaid:0,validUntil:new Date(0),revisionRequestStatus:'NONE' }]);
  const examId=id();await col('exams').insertOne({ _id:examId,title:'Selenium Scoring Exam',description:'One correct, one wrong and one skipped answer.',scope:'COURSE',courseId:id(courses.published),status:'PUBLISHED',approvalStatus:'APPROVED',createdById:id(users.teacher.id),duration:5,totalMarks:6,passMarks:2,maxAttempts:2,hasNegativeMarking:true,negativeMarkingValue:.25,questions:[0,1,2].map(n=>({ type:'MCQ',question:'Selenium question '+(n+1)+': What is 2 + 2?',options:['4','3','2','1'],correctAnswer:0,marks:2 })),createdAt:new Date(),updatedAt:new Date() });courses.exam=String(examId);
  serverLog=await fs.open(path.join(out,'server.log'),'a');
  let occupied=false;try{await fetch(base+'/api/auth/csrf',{signal:AbortSignal.timeout(2000)});occupied=true;}catch{}
  if(occupied)throw new Error('Port 3106 is already in use. Refusing to reuse another application server.');
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3106'],{windowsHide:true,stdio:['ignore',serverLog.fd,serverLog.fd],env:{...process.env,E_SIKHO_BUILD_DIR:build,MONGODB_URI:uri.toString(),AUTH_URL:base,NEXTAUTH_URL:base,AUTH_TRUST_HOST:'true',ENABLE_DEMO_CHECKOUT:String(runDemoCheckout)}});
  for(let n=0;n<60;n++){try{if((await fetch(base+'/api/auth/csrf')).ok)break;}catch{}if(n===59)throw Error('Selenium test server did not start.');await new Promise(resolve=>setTimeout(resolve,500));}
  driver=await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().addArguments('--headless=new','--window-size=1360,1000','--lang=en-US')).build();
  await driver.manage().setTimeouts({implicit:0,pageLoad:45000,script:30000});
  const caps=await driver.getCapabilities();data.browser=caps.get('browserName');data.browserVersion=caps.get('browserVersion');data.driverVersion=caps.get('chrome')?.chromedriverVersion?.split(' ')[0];
  data.browserTimezone=await driver.executeScript('return Intl.DateTimeFormat().resolvedOptions().timeZone');
  await save();
}

let examUrl,contestUrl,authored;
async function approve(kind) {
  await actor('admin');await goto('/admin/assessments');
  const card=await visible(By.xpath(`//article[contains(.,${quote('Global '+kind+' hosting')}) and contains(.,'Selenium Teacher')]`));
  await card.findElement(By.xpath(".//button[normalize-space(.)='Approve']")).click();await hasText('APPROVED');
}
async function fillExam(title) {
  await fill(By.css('input[placeholder="যেমন: কম্পিউটার সায়েন্স ও ডেটা স্ট্রাকচার পূর্ণাঙ্গ মডেল টেস্ট"]'),title);
  await fill(By.css('#question-card-0 textarea'),'What is two plus two?');
  const options=await driver.findElements(By.css('#question-card-0 input[placeholder^="অপশন"]'));
  for(const [index,value] of ['4','3','2','1'].entries())await options[index].sendKeys(value);
}
async function cases() {
  await run('SEL-01','Anonymous protected routes',['AUTH-04'],'All protected routes redirect to login.',async()=>{
    await actor('anon');for(const route of ['/student','/instructor','/admin']){await goto(route);await driver.wait(until.urlContains('/login'),10000);}return 'Student, instructor and admin pages redirected signed-out Chrome to login.';
  });
  await run('SEL-02','Wrong password in the login form',['AUTH-02'],'Invalid credentials show an error and create no session.',async()=>{
    await actor('anon');await goto('/login?tab=login');await fill(By.css('input[placeholder="017XXXXXXXX"]'),users.school.email);await fill(By.css('input[type=password]'),'WrongSeleniumPassword!');await click(By.css('form button[type=submit]'));await hasText('পাসওয়ার্ড');
    await driver.wait(async()=>{const t=await driver.findElement(By.css('body')).getText();return /ভুল|incorrect|invalid|wrong/i.test(t)},10000);assert((await driver.getCurrentUrl()).includes('/login'));
    const session=await driver.executeAsyncScript(done=>fetch('/api/auth/session').then(r=>r.json()).then(s=>done(!!s?.user?.id)));assert.equal(session,false);return 'Real login-form submission rejected a wrong password; Chrome remained signed out. No SMS/OTP delivery was performed.';
  });
  await run('SEL-03','Authenticated identity and reload',['AUTH-01'],'Real fixture identity and role persist across reload.',async()=>{
    await actor('school');await goto('/student');await hasText('Welcome, School!');await driver.navigate().refresh();await hasText('Welcome, School!');assert((await driver.getCurrentUrl()).includes('/student'));return 'Credentials-endpoint fixture session displayed the correct student dashboard and survived reload. Complete delivered-OTP UI login is outside this check.';
  });
  await run('SEL-04','Student and instructor role boundaries',['AUTH-05'],'Student author/admin and instructor admin routes are denied.',async()=>{
    await actor('school');for(const route of ['/instructor','/exams/create','/contests/create','/admin']){await goto(route);await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname!==route,10000);}
    await actor('teacher');await goto('/admin/assessments');await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname!=='/admin/assessments',10000);return 'Selenium navigation denied all four student privileged routes and the instructor superadmin review route.';
  });
  await run('SEL-05','Owned course selector and empty exam builder',['HOST-01','EXAM-01'],'Owned drafts/published courses appear; foreign courses and global permission do not.',async()=>{
    await actor('teacher');await goto('/exams/create');const select=await label('Course');const options=await select.getText();assert(options.includes('Selenium Draft Course')&&options.includes('Selenium Published Course'));assert(!options.includes('Other Selenium Course'));assert.equal(await (await visible(By.css('option[value=GLOBAL]'))).isEnabled(),false);assert.equal(await (await visible(By.css('#question-card-0 textarea'))).getAttribute('value'),'');return 'Owned draft/published options and blank question verified; foreign course absent and global option disabled.';
  });
  await run('SEL-06','Global exam request and approval',['HOST-03','HOST-05'],'Request stays pending until the superadmin approves it.',async()=>{
    await actor('teacher');await goto('/instructor/assessments');await fillLabel('Teaching purpose and intended audience','Selenium assessment for selected school science students.');await click(button('Submit application'));await hasText('PENDING');assert.equal((await col('globalassessmentpermissions').findOne({instructorId:id(users.teacher.id),kind:'EXAM'})).status,'PENDING');
    await approve('exam');await actor('teacher');await goto('/exams/create');assert.equal(await (await visible(By.css('option[value=GLOBAL]'))).isEnabled(),true);return 'Teacher request persisted PENDING; superadmin UI approval unlocked the global exam option.';
  });
  await run('SEL-07','Publish a targeted global exam',['AUD-02','AUD-08'],'Education, department and selected-student filters persist.',async()=>{
    await actor('teacher');await goto('/exams/create');await selectLabel('Assessment scope','GLOBAL');await (await label('School')).click();await fillLabel('Departments or study streams (comma separated)','Science');await fill(By.css('input[placeholder="Search by name or student ID"]'),'School Selenium Learner');await (await visible(By.xpath("//label[contains(.,'School Selenium Learner')]//input[@type='checkbox']"))).click();await fillExam('Selenium Targeted School Exam');await click(By.css('form button[type=submit]'));await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname==='/exams',15000);await hasText('Selenium Targeted School Exam');const exam=await col('exams').findOne({title:'Selenium Targeted School Exam'});assert(exam);assert.deepEqual(exam.audience.studentIds,[users.school.id]);assert.deepEqual(exam.audience.educationLevels,['SCHOOL']);assert.deepEqual(exam.audience.departments,['science']);examUrl='/exams/'+exam._id;return 'Selenium created a global exam; MongoDB persisted SCHOOL + normalized science + the selected student ID.';
  });
  await run('SEL-08','Targeted exam discovery and direct access',['AUD-02','AUD-07'],'Only an eligible student can discover and open the exam.',async()=>{
    if(!examUrl)throw new Blocked('Targeted exam creation did not produce an ID.');await actor('school');await goto('/');await hasText('Selenium Targeted School Exam');await goto(examUrl);await hasText('Selenium Targeted School Exam');await actor('college');await goto('/exams');await noText('Selenium Targeted School Exam');await goto(examUrl);await hasText('This exam is unavailable for your enrollment or audience profile.');await noText('Selenium Targeted School Exam');return 'Selected School learner saw the banner and exam. College learner saw neither listing nor private detail through the copied URL.';
  });
  await run('SEL-09','Contest permission is independent',['HOST-06','HOST-07'],'Exam approval does not grant contest hosting.',async()=>{
    await actor('teacher');await goto('/contests/create');assert.equal(await (await visible(By.css('option[value=GLOBAL]'))).isEnabled(),false);await goto('/instructor/assessments');await selectLabel('Request access for','CONTEST');await fillLabel('Teaching purpose and intended audience','Selenium university contest for CSE learners with moderation rules.');await click(button('Submit application'));await hasText('PENDING');await approve('contest');await actor('teacher');await goto('/contests/create');assert.equal(await (await visible(By.css('option[value=GLOBAL]'))).isEnabled(),true);return 'Contest global option remained locked after exam approval, then unlocked after a separate request and superadmin approval.';
  });
  await run('SEL-10','Targeted contest creation and exclusions',['AUD-03','CONTEST-01'],'University CSE sees the contest; EEE cannot open it.',async()=>{
    await actor('teacher');await goto('/contests/create');await selectLabel('Assessment scope','GLOBAL');await (await label('University')).click();await fillLabel('Departments or study streams (comma separated)','CSE');await fillLabel('Contest title','Selenium University CSE Contest');await fillLabel('Description and participation instructions','Disposable Selenium contest verification.');const local=delta=>new Date(Date.now()+delta+6*3600000).toISOString().slice(0,16);await fillLabel('Starts (your local time)',local(-60000));await fillLabel('Ends (your local time)',local(3600000));await fillLabel('Title','Addition');await fillLabel('Question (LaTeX supported)','What is two plus two?');for(let n=1;n<=4;n++)await fillLabel('Option '+n,String(5-n));await click(button('Publish contest'));await driver.wait(until.urlContains('/contests/selenium-university-cse-contest-'),15000);contestUrl=new URL(await driver.getCurrentUrl()).pathname;
    await actor('university');await goto('/');await hasText('Selenium University CSE Contest');await goto(contestUrl);await hasText('Selenium University CSE Contest');await actor('outsider');await goto('/contests');await noText('Selenium University CSE Contest');await goto(contestUrl);await hasText('404');return 'Teacher published a real targeted contest; University CSE listing/detail succeeded and EEE listing/direct access were denied.';
  });
  await run('SEL-11','Administrator assigns an existing course',['HOST-08'],'Assigned instructor can select the course without changing its owner.',async()=>{
    await actor('admin');await goto('/admin/assessments');await selectLabel('Course',courses.foreign);await fillLabel('Instructor email',users.teacher.email);await click(button('Grant course access'));await hasText('Instructor can now create assessments for this course.');await actor('teacher');await goto('/exams/create');assert((await (await label('Course')).getText()).includes('Other Selenium Course'));assert.equal(String((await col('courses').findOne({_id:id(courses.foreign)})).createdById),users.other.id);return 'Superadmin UI assignment added the existing course to the teacher’s assessment selector; MongoDB owner was unchanged.';
  });
  await run('SEL-12','Profile changes immediately update eligibility',['AUD-01','AUD-07'],'A saved department change removes stale exam eligibility.',async()=>{
    if(!examUrl)throw new Blocked('Targeted exam is unavailable.');await actor('school');await goto('/student/settings');await fillLabel('Department or study stream','Humanities');await click(button('Save Changes'));await dbWait(async()=>(await col('users').findOne({_id:id(users.school.id)})).department===(await (await label('Department or study stream')).getAttribute('value')),'The saved department did not match the form.');await driver.navigate().refresh();assert.equal(await (await label('Department or study stream')).getAttribute('value'),'Humanities');await goto(examUrl);await hasText('This exam is unavailable for your enrollment or audience profile.');await goto('/student/settings');await fillLabel('Department or study stream','Science');await click(button('Save Changes'));await dbWait(async()=>(await col('users').findOne({_id:id(users.school.id)})).department===(await (await label('Department or study stream')).getAttribute('value')),'The saved department did not match the form.');return 'Selenium changed Science to Humanities, verified persistence and immediate direct-link exclusion, then restored Science.';
  });
  await run('SEL-13','Create a course with no profile image',['COURSE-01'],'Image-less approved instructor can create and reopen curriculum.',async()=>{
    await actor('teacher');await goto('/instructor/create-course');for(const [name,value] of Object.entries({title:'Selenium Authored Course',titleEn:'Selenium Authored Course',description:'Created by Selenium using the real course form.',category:'Programming',moduleTitle:'Selenium Authored Module',lessonTitle:'Selenium Authored Lesson',lessonContent:'Original Selenium fixture lesson text.'}))await fill(By.css('[name="'+name+'"]'),value);await click(By.css('form button[type=submit]'));await driver.wait(until.urlMatches(/\/instructor\/courses\/[a-f0-9]{24}\/lectures/),15000);await hasText('Selenium Authored Lesson');const course=await col('courses').findOne({title:'Selenium Authored Course'});assert.equal(String(course.createdById),users.teacher.id);authored=String(course._id);await driver.navigate().refresh();await hasText('Selenium Authored Lesson');return 'Real course form created the course, module and lesson without a profile image; ownership and reopened curriculum passed.';
  });
  await run('SEL-14','Draft course direct link',['COURSE-02'],'Anonymous users cannot open an unpublished course.',async()=>{
    await actor('anon');await goto('/courses/'+(authored||courses.draft));await hasText('404');return 'Direct URL to a draft course displayed the not-found page in signed-out Chrome.';
  });
  await run('SEL-15','Free enrollment and duplicate prevention',['COURSE-05'],'Enrollment persists as one record after revisits.',async()=>{
    await actor('school');await goto('/courses/'+courses.published);await click(By.xpath("//button[contains(.,'Enroll') or contains(.,'ভর্তি হন')]"));await hasText('Welcome to your Course!');await driver.navigate().refresh();await hasText('Welcome to your Course!');assert.equal(await col('enrollments').countDocuments({userId:id(users.school.id),courseId:courses.published}),1);return 'Real free enrollment opened the course; reload retained access and exactly one enrollment record.';
  });
  await run('SEL-16','Lesson completion persists',['COURSE-08'],'Completing one of two lessons persists 50% progress.',async()=>{
    await actor('school');await goto('/courses/'+courses.published);await hasText('Welcome to your Course!');await click(By.css('button[title="Mark as Complete"]'));await dbWait(async()=>await col('lessonprogresses').countDocuments({userId:id(users.school.id),courseId:id(courses.published),isCompleted:true})===1,'Lesson completion was not persisted.');await driver.navigate().refresh();await hasText('50%');assert.equal((await driver.findElements(By.css('button[title="Mark as Incomplete"]'))).length,1);return 'Completion button wrote one actual lesson-progress record; after reload one of two lessons displayed 50%.';
  });
  await run('SEL-17','Revision request waits for review',['COURSE-09'],'Submitting a request does not unlock expired access.',async()=>{
    await actor('school');await goto('/courses/'+courses.revision);await click(button('Request Exam Revision Access'));await fill(By.css('input[type=date]'),'12/01/2099');await fill(By.css('textarea'),'I need this course to revise for my upcoming final examination.');await click(button('Submit revision request'));await hasText('Revision request pending review.');const e=await col('enrollments').findOne({userId:id(users.school.id),courseId:courses.revision});assert.equal(e.revisionRequestStatus,'PENDING');assert.equal(e.isRevisionGranted,false);return 'Student modal submitted a real revision request; MongoDB remained PENDING with isRevisionGranted=false.';
  });
  await run('SEL-18','Revision queue ownership',['COURSE-06','COURSE-09'],'An unrelated instructor cannot see another owner’s revision request.',async()=>{
    await actor('other');await goto('/instructor/revision-requests');await hasText('No revision requests yet.');await noText('Selenium Revision Course');return 'Unrelated instructor queue omitted the private revision request and showed its empty state.';
  });
  await run('SEL-19','Owner approval grants temporary access',['COURSE-09'],'Owner review grants the configured period and restores access.',async()=>{
    await actor('teacher');await goto('/instructor/revision-requests');await hasText('Selenium Revision Course');await click(button('Approve revision'));await hasText('APPROVED');const e=await col('enrollments').findOne({userId:id(users.school.id),courseId:courses.revision});assert.equal(e.isRevisionGranted,true);assert.equal(String(e.revisionReviewedBy),users.teacher.id);assert(new Date(e.revisionAccessExpiresAt).getTime()>Date.now()+6*86400000);await actor('school');await goto('/courses/'+courses.revision);await hasText('Exam Revision Access Active');return 'Course owner approved through Selenium; reviewer and seven-day grant were saved and the student saw active revision access.';
  });
  await run('SEL-20','Keyboard MCQ selection and modal return',['UI-03'],'Tab, Space and Enter select answers; modal Back preserves selection.',async()=>{
    await actor('school');await goto('/exams/'+courses.exam);await click(button('পরীক্ষা শুরু করুন'));const option=await visible(By.css('button[aria-label="A: 4"]'));async function tabTo(target){for(let n=0;n<100;n++){const active=await driver.switchTo().activeElement();if(await driver.executeScript('return arguments[0]===arguments[1]',active,target))return;await active.sendKeys(Key.TAB);}throw Error('Answer control was unreachable by Tab.');}
    await tabTo(option);await option.sendKeys(Key.SPACE);assert.equal(await option.getAttribute('aria-pressed'),'true');const other=await visible(By.css('button[aria-label="B: 3"]'));await tabTo(other);await other.sendKeys(Key.ENTER);assert.equal(await other.getAttribute('aria-pressed'),'true');await tabTo(option);await option.sendKeys(Key.SPACE);await click(button('Submit Exam'));await click(button('Back to Exam'));assert.equal(await (await visible(By.css('button[aria-label="A: 4"]'))).getAttribute('aria-pressed'),'true');return 'Selenium keyboard input reached options, changed selection with Space/Enter and preserved the final answer after returning from review.';
  });
  await run('SEL-21','Grading, persistence and cooldown label',['EXAM-04','EXAM-06'],'Correct/wrong/skipped score is 1.75/6; retry is on cooldown, below the cap.',async()=>{
    const active=await driver.findElements(By.css('button[aria-label="A: 4"]'));if(!active.length)throw new Blocked('The keyboard exam case did not leave an active exam.');await click(button('Next'));await click(By.css('button[aria-label="B: 3"]'));await click(button('Submit Exam'));await click(button('Yes, Submit'));await dbWait(async()=>await col('examsubmissions').findOne({examId:id(courses.exam),studentId:id(users.school.id)}),'Exam submission was not saved.');const sub=await col('examsubmissions').findOne({examId:id(courses.exam),studentId:id(users.school.id)});assert.equal(sub.score,1.75);assert.equal(sub.percentage,29);assert.equal(sub.passed,false);await goto('/exams/'+courses.exam);await hasText('Selenium Scoring Exam');await noText('Attempt Limit Reached');assert.equal(await col('examsubmissions').countDocuments({examId:id(courses.exam),studentId:id(users.school.id)}),1);return 'Real UI submission persisted 1.75/6, 29%, failed: one correct, one wrong and one skipped. Reload retained one submission and did not show the false attempt-limit warning at one of two attempts.';
  });
  await run('SEL-22','Empty dashboard has no invented progress',['DATA-01'],'Unenrolled learner sees no 67% or 30/45-minute progress.',async()=>{
    await actor('outsider');await goto('/student');await hasText('Welcome, EEE!');await noText('67%');await noText('30 of 45');assert.equal(await col('enrollments').countDocuments({userId:id(users.outsider.id)}),0);return 'Dashboard for a learner with zero enrollments showed no fabricated 67% or 30/45-minute progress.';
  });
  await run('SEL-23','Actual PDF viewer and resource visibility',['EXTRA-01','COURSE-04'],'Enrolled learner opens a real PDF; anonymous view exposes only preview resource.',async()=>{
    await actor('school');await goto('/courses/'+courses.published);await hasText('Welcome to your Course!');await click(exact('Lecture Slides & PDFs'));await hasText('Selenium Private Lesson PDF');const heading=await visible(By.xpath("//h3[normalize-space(.)='Selenium Private Lesson PDF']"));const card=await heading.findElement(By.xpath('../..'));await card.findElement(By.xpath(".//button[contains(.,'View Protected PDF')]")).click();const iframe=await visible(By.css('iframe[src*="selenium-test-resource-"]'));assert(await iframe.isDisplayed());const raw=await fetch(base+'/'+path.basename(pdfPath));const rawBytes=Buffer.from(await raw.arrayBuffer());data.pdfDelivery={nodeStatus:raw.status,nodePrefix:rawBytes.subarray(0,5).toString()};await save();assert.equal(rawBytes.subarray(0,5).toString(),'%PDF-',JSON.stringify(data.pdfDelivery));const pdf=await driver.executeAsyncScript(function(url,done){fetch(url,{cache:'no-store'}).then(async r=>{const bytes=await r.arrayBuffer();done({url:r.url,status:r.status,type:r.headers.get('content-type'),length:bytes.byteLength,prefix:new TextDecoder().decode(bytes.slice(0,5))})}).catch(e=>done({error:e.message}));},'/'+path.basename(pdfPath));data.pdfDelivery.browser=pdf;await save();assert.equal(pdf.prefix,'%PDF-',JSON.stringify(pdf));assert(pdf.type.includes('pdf'));await actor('anon');await goto('/courses/'+courses.published);await click(exact('Lecture Slides & PDFs'));await hasText('Selenium Preview Lesson PDF');await noText('Selenium Private Lesson PDF');return 'Enrolled Selenium session opened the actual PDF iframe and received valid PDF bytes; anonymous resource tab showed only preview metadata. Underlying public-URL secrecy was not certified.';
  });
  await run('SEL-24','Responsive principal pages',['UI-01'],'No horizontal overflow at 360px and desktop widths.',async()=>{
    for(const width of [360,1280]){await driver.manage().window().setRect({width,height:1000});for(const [key,route] of [['anon','/login'],['school','/courses/'+courses.published],['teacher','/exams/create'],['teacher','/contests/create']]){await actor(key);await goto(route);const size=await driver.executeScript('return {scroll:document.documentElement.scrollWidth,width:innerWidth}');assert(size.scroll<=size.width+2,route+' overflow at '+width);}}await driver.manage().window().setRect({width:1360,height:1000});return 'Login, course detail, exam form and contest form had no horizontal overflow at 360px and 1280px window sizes.';
  });
  await run('SEL-25','Language preference and profile preservation',['UI-02'],'Language persists after reload while saved values stay unchanged.',async()=>{
    await actor('school');await goto('/student/settings');await click(button('বাং'));await hasText('পরিবর্তন সংরক্ষণ করুন');await driver.navigate().refresh();await hasText('পরিবর্তন সংরক্ষণ করুন');await click(button('EN'));await hasText('Save Changes');assert.equal(await (await label('Department or study stream')).getAttribute('value'),'Science');return 'Selenium switched to Bangla, reloaded successfully, switched back to English and verified the saved Science department.';
  });
  await run('SEL-26','Missing course, exam and contest links',['UI-04'],'Missing identifiers fail gracefully without unrelated content.',async()=>{
    await actor('anon');await goto('/courses/507f1f77bcf86cd799439099');await hasText('404');await goto('/exams/507f1f77bcf86cd799439099');await hasText('পরীক্ষাটি পাওয়া যায়নি।');await goto('/contests/selenium-missing-contest');await hasText('404');return 'Selenium verified safe not-found states for nonexistent course, exam and contest links.';
  });
  await run('SEL-27','Signout removes protected navigation',['AUTH-06'],'After UI signout, protected revisits redirect to login.',async()=>{
    await actor('school');await goto('/student');await hasText('Welcome, School!');await click(By.css('button[title="Log Out"]'));await driver.wait(async()=>!new URL(await driver.getCurrentUrl()).pathname.startsWith('/student'),15000);currentActor=undefined;await goto('/student');await driver.wait(until.urlContains('/login'),10000);return 'Navbar signout removed the session; revisiting the student dashboard redirected to login.';
  });
  await run('SEL-28','Read navigation does not reseed content',['DATA-03'],'Repeated visits leave content counts unchanged.',async()=>{
    await actor('outsider');const names=['users','courses','exams','contests','notifications'];const before=await Promise.all(names.map(n=>col(n).countDocuments()));for(const route of ['/','/courses','/exams','/contests','/student']){await goto(route);await driver.navigate().refresh();}const after=await Promise.all(names.map(n=>col(n).countDocuments()));assert.deepEqual(after,before);return 'Selenium navigation/reloads left user, course, exam, contest and notification counts unchanged; no sample reseeding.';
  });
  await run('SEL-29', 'Demo card checkout and administrator approval', [], 'A simulated purchase stays locked until admin approval, then grants access with zero paid.', async () => {
    const courseId = courses.demoPaid;
    const enrollmentFilter = { userId: id(users.school.id), courseId };
    const courseUrl = '/courses/' + courseId;
    const checkoutUrl = '/payment/' + courseId;
    await actor('school');
    await goto(courseUrl);
    await click(By.id('btn-enroll-now'));
    await driver.wait(until.urlIs(base + checkoutUrl), 15000);
    await hasText('Demo checkout');
    await hasText('Demo card');
    await hasText('4242 4242 4242 4242');
    await hasText('BDT 500');
    const paymentPanel = await visible(By.css('section[aria-labelledby="purchase-panel"]'));
    const editableCardFields = await paymentPanel.findElements(By.css('input, textarea, [contenteditable="true"]'));
    assert.equal(editableCardFields.length, 0);
    await click(button('Send demo purchase request'));
    await hasText('Awaiting admin approval');
    await driver.navigate().refresh();
    await hasText('Awaiting admin approval');
    const forgedConfirmationStatus = await driver.executeAsyncScript((courseId, done) => {
      fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, status: 'success' }),
      }).then((response) => done(response.status), () => done(0));
    }, courseId);
    assert.equal(forgedConfirmationStatus, 503);
    assert.equal(await col('enrollments').countDocuments({ ...enrollmentFilter, paymentStatus: 'DEMO_PENDING', amountPaid: 0 }), 1);
    assert.equal(await col('courses').countDocuments({ _id: id(courseId), studentsEnrolled: 0 }), 1);
    await goto(courseUrl);
    await visible(By.id('btn-enroll-now'));
    await noText('Welcome to your Course!');

    await actor('purchaseAdmin');
    await goto('/admin');
    await hasText('Demo Purchase Approvals');
    const request = await visible(By.xpath("//*[@id='demo-purchases']//li[contains(.,'Selenium Demo Paid Course') and contains(.,'School Selenium Learner')]"));
    await request.findElement(By.xpath(".//button[normalize-space(.)='Approve Demo Purchase']")).click();
    await hasText('No demo purchases are awaiting approval.');

    await actor('school');
    await goto(checkoutUrl);
    await hasText('Course access is available');
    await click(By.linkText('Open course'));
    await hasText('Welcome to your Course!');
    assert.equal(await col('enrollments').countDocuments(enrollmentFilter), 1);
    assert.equal(await col('enrollments').countDocuments({ ...enrollmentFilter, paymentStatus: 'GRANTED', amountPaid: 0, 'demoPurchase.amount': 500, 'demoPurchase.approvedBy': id(users.purchaseAdmin.id) }), 1);
    assert.equal(await col('courses').countDocuments({ _id: id(courseId), studentsEnrolled: 1 }), 1);
    assert.equal(await col('payments').countDocuments({ userId: enrollmentFilter.userId, courseId: { $in: [courseId, id(courseId)] } }), 0);
    return 'Sample card checkout stayed pending across reload and kept the course locked. The payment API rejected a forged confirmation. Regular admin approval created one grant with zero paid and no payment record.';
  });
  for(const [caseId,title,planIds,reason] of [
    ['SEL-X01','Delivered OTP signup/login',['AUTH-03'],'No configured SMS provider and controlled receiving phone. No SMS was sent; fixture session setup does not verify OTP delivery.'],
    ['SEL-X02','Real Google consent login',['AUTH-08'],'No team-controlled Google consent session. Provider signup/login and cancellation require interactive account-holder access.'],
    ['SEL-X03','Real owner and Test Admin login',['DATA-02'],'Fixture role sessions are verified; real account-holder sessions were not provided and no credentials were reset.'],
    ['SEL-X04','Physical mobile protected playback',['VIDEO-06'],'This Selenium run used desktop Chrome only. No physical mobile browser was connected; earlier emulation results are separate.'],
  ])await run(caseId,title,planIds,'Complete the external prerequisite and verify the real flow.',async()=>{throw new Blocked(reason);});
}

try { await setup();await cases(); }
catch(error) { data.fatal=String(error.message||error).replace(/mongodb(?:\+srv)?:\/\/\S+/g,'[redacted connection]');process.exitCode=1;console.error('Selenium setup/run failed: '+data.fatal); }
finally {
  if(driver)await driver.quit().catch(()=>{});
  if(server){server.kill();await new Promise(resolve=>setTimeout(resolve,500));}
  if(serverLog)await serverLog.close();
  if(pdfPath){assert(path.dirname(pdfPath)===path.resolve('public')&&/^selenium-test-resource-[a-f0-9]{12}\.pdf$/.test(path.basename(pdfPath)));await fs.rm(pdfPath,{force:true});data.temporaryPdfRemoved=true;}
  if(connection){assert(connection.name===databaseName&&/^e_sikho_selenium_test_[a-f0-9]{12}$/.test(databaseName),'Unexpected database: cleanup refused.');await connection.dropDatabase();await connection.close();data.databaseRemoved=true;}
  data.finishedAt=new Date().toISOString();data.summary={passed:data.results.filter(r=>r.status==='Pass').length,failed:data.results.filter(r=>r.status==='Fail').length,blocked:data.results.filter(r=>r.status==='Blocked').length};
  if(data.summary.failed)process.exitCode=1;
  await save();console.log('Selenium summary: '+JSON.stringify(data.summary));console.log('Disposable database removed: '+data.databaseRemoved+'; temporary PDF removed: '+data.temporaryPdfRemoved);
}
