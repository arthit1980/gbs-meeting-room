// ระบบจองห้องประชุม - LocalStorage Version
(function() {
  'use strict';

  // ดึงข้อมูลจอง
  function getBookings() {
    const bookings = localStorage.getItem('roomBookings');
    return bookings ? JSON.parse(bookings) : [];
  }

  // บันทึกข้อมูลจอง
  function saveBookings(bookings) {
    localStorage.setItem('roomBookings', JSON.stringify(bookings));
  }

  // ตั้งวันที่ขั้นต่ำเป็นวันนี้
  window.addEventListener('load', function() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = yyyy + '-' + mm + '-' + dd;
    document.getElementById('date').setAttribute('min', todayStr);
  });

  // Event listeners
  document.getElementById('room').addEventListener('change', handleRoomDateChange);
  document.getElementById('date').addEventListener('change', handleRoomDateChange);
  document.getElementById('startTime').addEventListener('change', validateStartTime);
  document.getElementById('startTime').addEventListener('blur', validateStartTime);
  document.getElementById('endTime').addEventListener('change', validateEndTime);
  document.getElementById('endTime').addEventListener('blur', validateEndTime);
  document.getElementById('bookingForm').addEventListener('submit', handleSubmit);
  document.getElementById('viewBookingsBtn').addEventListener('click', showBookingsModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  
  // ปิด modal เมื่อคลิกนอก modal
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('bookingsModal');
    if (e.target === modal) {
      closeModal();
    }
  });

  // ฟังก์ชันจัดการเมื่อเปลี่ยนห้องหรือวันที่
  function handleRoomDateChange() {
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');

    if (room && date) {
      startTimeInput.disabled = false;
      endTimeInput.disabled = false;
      
      // Clear previous values and errors
      startTimeInput.value = '';
      endTimeInput.value = '';
      document.getElementById('startTimeError').textContent = '';
      document.getElementById('endTimeError').textContent = '';
      startTimeInput.classList.remove('error-border');
      endTimeInput.classList.remove('error-border');
    } else {
      startTimeInput.disabled = true;
      endTimeInput.disabled = true;
      startTimeInput.value = '';
      endTimeInput.value = '';
      document.getElementById('startTimeError').textContent = '';
      document.getElementById('endTimeError').textContent = '';
    }
  }

  // ฟังก์ชันตรวจสอบเวลาเริ่ม
  function validateStartTime() {
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const startTimeInput = document.getElementById('startTime');
    const errorElement = document.getElementById('startTimeError');

    if (!startTime) {
      errorElement.textContent = '';
      startTimeInput.classList.remove('error-border');
      return;
    }

    // ตรวจสอบว่าเวลาอยู่ในช่วง 08:00 - 18:00
    const [hours, minutes] = startTime.split(':').map(Number);
    if (hours < 8 || hours >= 18) {
      errorElement.textContent = 'กรุณาเลือกเวลาระหว่าง 08:00 - 18:00 น.';
      startTimeInput.classList.add('error-border');
      return;
    }

    // ตรวจสอบว่าเวลานี้ถูกจองไปแล้วหรือไม่
    const isBooked = checkIfTimeBooked(date, room, startTime);

    if (isBooked) {
      errorElement.textContent = 'ไม่สามารถเลือกเวลานี้ได้ เนื่องจากมีการจองแล้ว';
      startTimeInput.classList.add('error-border');
    } else {
      errorElement.textContent = '';
      startTimeInput.classList.remove('error-border');
      
      // ถ้ามีการเลือกเวลาสิ้นสุดไว้แล้ว ให้ตรวจสอบใหม่
      const endTime = document.getElementById('endTime').value;
      if (endTime) {
        validateEndTime();
      }
    }
  }

  // ฟังก์ชันตรวจสอบเวลาสิ้นสุด
  function validateEndTime() {
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const endTimeInput = document.getElementById('endTime');
    const errorElement = document.getElementById('endTimeError');

    if (!endTime) {
      errorElement.textContent = '';
      endTimeInput.classList.remove('error-border');
      return;
    }

    if (!startTime) {
      errorElement.textContent = 'กรุณาเลือกเวลาเริ่มก่อน';
      endTimeInput.classList.add('error-border');
      return;
    }

    // ตรวจสอบว่าเวลาสิ้นสุดมากกว่าเวลาเริ่ม
    if (endTime <= startTime) {
      errorElement.textContent = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม';
      endTimeInput.classList.add('error-border');
      return;
    }

    // ตรวจสอบว่าเวลาอยู่ในช่วง 08:00 - 18:00
    const [hours, minutes] = endTime.split(':').map(Number);
    if (hours < 8 || hours > 18 || (hours === 18 && minutes > 0)) {
      errorElement.textContent = 'กรุณาเลือกเวลาไม่เกิน 18:00 น.';
      endTimeInput.classList.add('error-border');
      return;
    }

    // ตรวจสอบว่าช่วงเวลานี้มีการจองซ้อนทับหรือไม่
    const hasOverlap = checkTimeRangeOverlap(date, room, startTime, endTime);

    if (hasOverlap) {
      errorElement.textContent = 'ไม่สามารถเลือกช่วงเวลานี้ได้ มีการจองในช่วงนี้แล้ว';
      endTimeInput.classList.add('error-border');
    } else {
      errorElement.textContent = '';
      endTimeInput.classList.remove('error-border');
    }
  }

  // ฟังก์ชันตรวจสอบว่าเวลาถูกจองหรือไม่
  function checkIfTimeBooked(date, room, time) {
    const bookings = getBookings();
    
    for (let booking of bookings) {
      if (booking.date === date && booking.room === room) {
        // ตรวจสอบว่าเวลาที่เลือกอยู่ระหว่างการจองที่มีอยู่
        if (time >= booking.startTime && time < booking.endTime) {
          return true;
        }
      }
    }
    return false;
  }

  // ฟังก์ชันตรวจสอบการซ้อนทับของช่วงเวลา
  function checkTimeRangeOverlap(date, room, startTime, endTime) {
    const bookings = getBookings();
    
    for (let booking of bookings) {
      if (booking.date === date && booking.room === room) {
        // ตรวจสอบการซ้อนทับ: (start1 < end2) && (end1 > start2)
        if (startTime < booking.endTime && endTime > booking.startTime) {
          return true;
        }
      }
    }
    return false;
  }

  // ฟังก์ชันจัดการการ submit form
  function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const loading = document.querySelector('.loading');

    // ตรวจสอบ validation ก่อน submit
    validateStartTime();
    validateEndTime();

    const hasErrors = 
      document.getElementById('startTimeError').textContent !== '' ||
      document.getElementById('endTimeError').textContent !== '';

    if (hasErrors) {
      showMessage('กรุณาตรวจสอบข้อมูลที่กรอก', 'error');
      return;
    }

    // รวบรวมข้อมูล
    const formData = {
      id: Date.now().toString(),
      room: document.getElementById('room').value,
      date: document.getElementById('date').value,
      startTime: document.getElementById('startTime').value,
      endTime: document.getElementById('endTime').value,
      topic: document.getElementById('topic').value,
      chairman: document.getElementById('chairman').value,
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      createdAt: new Date().toLocaleString('th-TH')
    };

    // แสดง loading
    submitBtn.disabled = true;
    loading.style.display = 'block';
    hideMessage();

    // จำลองการบันทึก (ใช้ setTimeout เพื่อให้เห็น loading)
    setTimeout(function() {
      // บันทึกข้อมูล
      const bookings = getBookings();
      bookings.push(formData);
      saveBookings(bookings);

      showMessage('บันทึกการจองเรียบร้อยแล้ว!', 'success');
      document.getElementById('bookingForm').reset();

      // Reset inputs
      document.getElementById('startTime').disabled = true;
      document.getElementById('endTime').disabled = true;
      document.getElementById('startTimeError').textContent = '';
      document.getElementById('endTimeError').textContent = '';
      document.getElementById('startTime').classList.remove('error-border');
      document.getElementById('endTime').classList.remove('error-border');

      // Reset min date
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const todayStr = yyyy + '-' + mm + '-' + dd;
      document.getElementById('date').setAttribute('min', todayStr);

      submitBtn.disabled = false;
      loading.style.display = 'none';
    }, 500);
  }

  // ฟังก์ชันแสดง Modal รายการจอง
  function showBookingsModal() {
    const modal = document.getElementById('bookingsModal');
    const bookingsList = document.getElementById('bookingsList');
    const bookings = getBookings();

    if (bookings.length === 0) {
      bookingsList.innerHTML = '<div class="no-bookings">ยังไม่มีรายการจอง</div>';
    } else {
      // เรียงข้อมูลตามวันที่และเวลา
      bookings.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });

      let html = '';
      bookings.forEach(booking => {
        html += `
          <div class="booking-card">
            <h3>🏢 ${booking.room}</h3>
            <p><strong>📅 วันที่:</strong> ${formatDate(booking.date)}</p>
            <p><strong>🕐 เวลา:</strong> ${booking.startTime} - ${booking.endTime} น.</p>
            <p><strong>📋 หัวข้อ:</strong> ${booking.topic}</p>
            <p><strong>👤 ประธาน:</strong> ${booking.chairman}</p>
            <p><strong>📝 ผู้จอง:</strong> ${booking.name}</p>
            <p><strong>📞 เบอร์:</strong> ${booking.phone}</p>
            <p><strong>⏰ บันทึกเมื่อ:</strong> ${booking.createdAt}</p>
            <button class="delete-btn" onclick="deleteBooking('${booking.id}')">🗑️ ลบการจอง</button>
          </div>
        `;
      });
      bookingsList.innerHTML = html;
    }

    modal.style.display = 'block';
  }

  // ฟังก์ชันปิด Modal
  function closeModal() {
    const modal = document.getElementById('bookingsModal');
    modal.style.display = 'none';
  }

  // ฟังก์ชันลบการจอง
  window.deleteBooking = function(id) {
    if (confirm('คุณต้องการลบการจองนี้ใช่หรือไม่?')) {
      let bookings = getBookings();
      bookings = bookings.filter(b => b.id !== id);
      saveBookings(bookings);
      showBookingsModal(); // รีเฟรช modal
      showMessage('ลบการจองเรียบร้อยแล้ว', 'success');
    }
  };

  // ฟังก์ชันจัดรูปแบบวันที่
  function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  }

  // ฟังก์ชันแสดงข้อความ
  function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';

    // ซ่อนข้อความหลังจาก 6 วินาที
    setTimeout(function() {
      hideMessage();
    }, 6000);
  }

  // ฟังก์ชันซ่อนข้อความ
  function hideMessage() {
    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'none';
  }

})();