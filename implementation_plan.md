# Implementation Plan (แผนการดำเนินงาน) - Rebranding & Rebuilding Youtube Downloader (Dubplitube)

We are going to transform the current skeleton code into **Dubplitube**—a fully functional, visually stunning YouTube and Shorts downloader with a premium neon dark glassmorphic theme.

<span style="color: #38bdf8;">เราจะเปลี่ยนโครงสร้างโค้ดจำลองที่มีอยู่เดิมให้กลายเป็น **Dubplitube** — ส่วนขยายดาวน์โหลดวิดีโอ YouTube และ Shorts ที่ใช้งานได้จริง 100% พร้อมดีไซน์ Neon Dark Glassmorphism ระดับพรีเมียม</span>

We will implement a hybrid architecture:
1. **Direct Public API Download** (Option A) by default for seamless out-of-the-box browser execution.
2. **Local Companion Backend support** (Option B) built into the code so users can toggle to high-performance local downloads if they wish.

<span style="color: #38bdf8;">เราจะใช้โครงสร้างแบบไฮบริด:
1. **การดาวน์โหลดผ่าน API สาธารณะโดยตรง** (ตัวเลือก A) เป็นค่าเริ่มต้นเพื่อให้สามารถใช้งานบนเบราว์เซอร์ได้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม
2. **รองรับ Local Companion Backend** (ตัวเลือก B) ที่ฝังไว้ในโค้ด เพื่อให้ผู้ใช้สามารถสลับไปใช้การดาวน์โหลดผ่านระบบเครื่องตัวเองที่มีประสิทธิภาพสูงขึ้นได้หากต้องการ</span>

---

## User Review Required / ส่วนที่ต้องการให้ผู้ใช้ตรวจสอบ

> [!IMPORTANT]
> **[EN] To load and test the extension immediately in Google Chrome:**
> 1. Open Google Chrome and navigate to `chrome://extensions/`
> 2. Enable **Developer mode** (top right switch).
> 3. Click **Load unpacked** (top left button) and select the `d:\Dubplitube` folder.
> 
> *Our design will support direct execution without requiring Webpack building first, making testing and development extremely smooth!*

> [!IMPORTANT]
> <span style="color: #38bdf8;">**[TH] ขั้นตอนการโหลดและทดสอบส่วนขยาย (Extension) ใน Google Chrome ทันที:**
> 1. เปิด Google Chrome และเข้าไปที่หน้า `chrome://extensions/`
> 2. เปิดใช้งาน **Developer mode (โหมดนักพัฒนาซอฟต์แวร์)** (สวิตช์มุมขวาบน)
> 3. คลิกปุ่ม **Load unpacked (โหลดโฟลเดอร์ที่ขยายแล้ว)** (ปุ่มมุมซ้ายบน) แล้วเลือกโฟลเดอร์ `d:\Dubplitube`
> 
> *โครงสร้างที่เราพัฒนาจะรองรับการรันโค้ดสดได้ทันทีโดยไม่จำเป็นต้องผ่านกระบวนการ Build ของ Webpack ก่อน ทำให้การทดสอบและการพัฒนาสะดวกรวดเร็วอย่างยิ่ง!*</span>

---

## Proposed Changes / การเปลี่ยนแปลงที่เสนอ

### Component 1: Branding & Manifest Update / การปรับแต่งแบรนด์และอัปเดตไฟล์ Manifest

#### [MODIFY] [manifest.json](file:///d:/Dubplitube/manifest.json)
*   **[EN]** Rename extension from `"Tubly Downloader"` to `"Dubplitube"`. Update description and ensure all necessary script paths (`src/content.js`, `src/background.js`, `src/styles.css`) are registered properly.
*   <span style="color: #38bdf8;">**[TH]** เปลี่ยนชื่อส่วนขยายจาก `"Tubly Downloader"` เป็น `"Dubplitube"` อัปเดตคำอธิบาย และตรวจสอบให้แน่ใจว่าได้ระบุเส้นทางไฟล์สคริปต์ที่จำเป็นทั้งหมด (`src/content.js`, `src/background.js`, `src/styles.css`) อย่างถูกต้อง</span>

---

### Component 2: Premium UI Design (Popup HTML & CSS) / การออกแบบ UI พรีเมียม (Popup HTML & CSS)

#### [MODIFY] [src/popup.html](file:///d:/Dubplitube/src/popup.html)
*   **[EN]** Rebrand the title to **Dubplitube** with custom HTML structure. Update asset path references and add a toggle for "Quick Settings" to switch download engines.
*   <span style="color: #38bdf8;">**[TH]** ปรับปรุงแบรนด์และชื่อหัวข้อใน HTML เป็น **Dubplitube** ปรับปรุงการอ้างอิงตำแหน่งโฟลเดอร์ Asset และเพิ่มสวิตช์ "Quick Settings" เพื่อสลับโหมดเอนจิ้นการดาวน์โหลด</span>

#### [NEW] [src/styles.css](file:///d:/Dubplitube/src/styles.css)
*   **[EN]** Implement a stunning dark glassmorphic design using vanilla CSS:
    *   Solid deep charcoal backdrop (`#0d0e12`) with glass panels (`rgba(255, 255, 255, 0.03)` with `backdrop-filter`).
    *   Electric purple (`#8b5cf6`) to vibrant neon-cyan/pink gradient flows.
    *   Smooth transitions and micro-animations for quality buttons and progress bars.
*   <span style="color: #38bdf8;">**[TH]** พัฒนาดีไซน์ Dark Glassmorphic สุดล้ำด้วย Vanilla CSS:
    *   พื้นหลังสีชาร์โคลเข้มสวยงาม (`#0d0e12`) ร่วมกับพาเนลกระจกฝ้า (`rgba(255, 255, 255, 0.03)` คู่กับ `backdrop-filter`)
    *   การไล่เฉดสีแบบนีออนจากม่วงไฟฟ้า (`#8b5cf6`) ไปยังชมพู/ฟ้าเรืองแสง
    *   Micro-animations และการเปลี่ยนผ่านที่นุ่มนวลสำหรับปุ่มเลือกความละเอียดและแถบความคืบหน้า (Progress Bar)</span>

---

### Component 3: Extension Logic & Scraping (JavaScript) / ตรรกะส่วนขยายและการดึงข้อมูลหน้าเว็บ (JavaScript)

#### [NEW] [src/content.js](file:///d:/Dubplitube/src/content.js)
*   **[EN]** **Video Metadata Scraper**: Extract dynamic values (Title, Channel, Length, Thumbnail URL, Video ID) from the active YouTube page.
*   **[EN]** **DOM Button Injector**: Inject a gorgeous, native-styled "📥 Download" button directly next to YouTube's "Subscribe" or "Share" buttons under the player, and as an overlay on YouTube Shorts. Handle single-page navigation seamlessly.
*   <span style="color: #38bdf8;">**[TH]** **ระบบดึงข้อมูลวิดีโอ**: ดึงข้อมูลแบบไดนามิก (ชื่อวิดีโอ, ช่อง, ความยาว, ลิงก์รูปหน้าปก, และไอดีวิดีโอ) จากหน้าเว็บ YouTube ที่เปิดอยู่ปัจจุบัน</span>
*   <span style="color: #38bdf8;">**[TH]** **ระบบฝังปุ่มบนหน้าเว็บ**: ฝังปุ่ม "📥 Download" สไตล์เนทีฟที่กลมกลืนกับดีไซน์ใหม่ของ YouTube ไว้ข้างๆ ปุ่มซับสไครบ์หรือแชร์ใต้เครื่องเล่นวิดีโอ และสร้างปุ่มลอยซ้อนทับสำหรับ YouTube Shorts พร้อมจัดการระบบซิงก์ข้อมูลตามการเปลี่ยนหน้าของเบราว์เซอร์อย่างไร้รอยต่อ</span>

#### [NEW] [src/background.js](file:///d:/Dubplitube/src/background.js)
*   **[EN]** Handle communication between scripts. Manage file downloads via `chrome.downloads` API, implement filename sanitization, and manage connections to download APIs or local companion app.
*   <span style="color: #38bdf8;">**[TH]** จัดการระบบสื่อสารเบื้องหลังระหว่างสคริปต์ต่างๆ ควบคุมการดาวน์โหลดไฟล์ผ่าน API `chrome.downloads` จัดการล้างอักขระพิเศษออกจากชื่อไฟล์เพื่อป้องกันข้อผิดพลาดของระบบ และจัดการการเชื่อมต่อไปยัง API ดาวน์โหลดหรือโปรแกรม Companion เครื่องฝั่งเครื่องใช้</span>

#### [MODIFY] [src/popup.js](file:///d:/Dubplitube/src/popup.js)
*   **[EN]** Connect to real background downloader. List actual available formats (MP4 HD, MP3 Audio) and persist settings via `chrome.storage.local`.
*   <span style="color: #38bdf8;">**[TH]** เชื่อมต่อกับระบบดาวน์โหลดเบื้องหลังจริง แสดงรายการฟอร์แมตดาวน์โหลดที่มีอยู่จริง (MP4 HD, MP3 Audio) และบันทึกการตั้งค่าของผู้ใช้ไว้ในหน่วยความจำของส่วนขยายด้วย `chrome.storage.local`</span>

---

## Verification Plan / แผนการทดสอบความถูกต้อง

### Manual Verification / การทดสอบด้วยตนเอง
1.  **[EN] Load Unpacked Extension**: Verify that Chrome loads the extension without any schema or registration errors.
    <span style="color: #38bdf8;">**[TH] ตรวจสอบการโหลดส่วนขยาย**: ตรวจสอบว่า Google Chrome สามารถโหลดตัวขยายที่แตกโฟลเดอร์นี้เข้าไประบบได้โดยไม่มีข้อผิดพลาดของ Manifest หรือข้อจำกัดอื่นใด</span>
2.  **[EN] Popup Interface Audit**: Verify the visual rendering on Google Chrome popup window. It must be highly aesthetic, with readable typography, glassmorphic card borders, and responsive grid layouts.
    <span style="color: #38bdf8;">**[TH] ทดสอบหน้าตา UI ของ Popup**: ตรวจสอบการแสดงผลบนหน้าต่างป๊อปอัปของ Chrome ว่าสวยงาม ตัวอักษรอ่านง่าย มีบอร์ดเดอร์กระจกฝ้าแบบเรืองแสง และมีเลย์เอาต์การจัดวางที่เป็นระเบียบ</span>
3.  **[EN] YouTube DOM Injection Test**: Open a YouTube video (and a YouTube Shorts video) to check if the "Download" button is correctly injected, styles match perfectly, and it is responsive to single-page navigation.
    <span style="color: #38bdf8;">**[TH] ทดสอบการฝังปุ่มบน YouTube**: เปิดวิดีโอปกติและ Shorts บนหน้า YouTube เพื่อตรวจสอบว่าปุ่มดาวน์โหลดที่เขียนขึ้นถูกแทรกเข้าไปได้อย่างเหมาะสม หน้าตาสวยงามกลมกลืน และทำงานได้อย่างถูกต้องเมื่อมีการเปลี่ยนวิดีโอถัดไปโดยไม่ได้รีโหลดหน้าเว็บ</span>
4.  **[EN] Actual Download Lifecycle**: Test selecting a format, initiating the download, displaying the real progress bar, and validating that the resulting file is saved successfully in the browser's "Downloads" folder with the name `[Dubplitube] Video Title.mp4`.
    <span style="color: #38bdf8;">**[TH] ทดสอบกระบวนการดาวน์โหลดจริง**: ทดสอบเลือกรูปแบบความละเอียด เริ่มดาวน์โหลด สังเกตการแสดงความคืบหน้าของแถบโปรเกรส และตรวจสอบว่าไฟล์สุดท้ายถูกดาวน์โหลดเข้าสู่โฟลเดอร์ "Downloads" ของเครื่องจริง โดยตั้งชื่อไฟล์เป็นระเบียบ เช่น `[Dubplitube] Video Title.mp4`</span>
