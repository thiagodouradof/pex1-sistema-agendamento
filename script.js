document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const calendarDays = document.getElementById("calendar-days");
  const currentMonthElement = document.getElementById("current-month");
  const prevMonthButton = document.getElementById("prev-month");
  const nextMonthButton = document.getElementById("next-month");
  const bookingForm = document.getElementById("booking-form");
  const eventModal = document.getElementById("event-modal");
  const closeModal = document.querySelector(".close");
  const cancelBookingButton = document.getElementById("cancel-booking");

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDate = null;
  let bookings = JSON.parse(localStorage.getItem("churchBookings")) || [];
  let selectedBookingId = null;

  initTabs();
  renderCalendar();
  updateDayEvents();
  setupEventListeners();

  function initTabs() {
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabId = button.getAttribute("data-tab");

        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        button.classList.add("active");
        document.getElementById(tabId).classList.add("active");
      });
    });
  }

  function renderCalendar() {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    calendarDays.innerHTML = "";

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    let firstDayIndex = firstDay.getDay();

    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = firstDayIndex; i > 0; i--) {
      const day = prevLastDay - i + 1;
      const dayElement = createDayElement(day, "other-month");
      calendarDays.appendChild(dayElement);
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(currentYear, currentMonth, i);
      const isToday = dayDate.toDateString() === today.toDateString();
      const hasEvents = hasEventsOnDate(dayDate);

      let className = "";
      if (isToday) className = "today";
      if (hasEvents) className += " has-events";
      if (
        selectedDate &&
        dayDate.toDateString() === selectedDate.toDateString()
      ) {
        className += " selected";
      }

      const dayElement = createDayElement(i, className, dayDate);
      calendarDays.appendChild(dayElement);
    }

    const lastDayIndex = lastDay.getDay();
    const nextDays = 7 - lastDayIndex - 1;

    for (let i = 1; i <= nextDays; i++) {
      const dayElement = createDayElement(i, "other-month");
      calendarDays.appendChild(dayElement);
    }
  }

  function createDayElement(day, className, date = null) {
    const dayElement = document.createElement("div");
    dayElement.className = `calendar-day ${className}`;
    dayElement.textContent = day;

    if (date) {
      dayElement.setAttribute("data-date", date.toISOString());

      dayElement.addEventListener("click", () => {
        document.querySelectorAll(".calendar-day.selected").forEach((el) => {
          el.classList.remove("selected");
        });

        dayElement.classList.add("selected");

        selectedDate = date;
        updateDayEvents();
      });
    }

    return dayElement;
  }

  function hasEventsOnDate(date) {
    return bookings.some((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString();
    });
  }

  function updateDayEvents() {
    const selectedDateElement = document.getElementById("selected-date");
    const eventsList = document.getElementById("events-list");

    if (!selectedDate) {
      selectedDateElement.textContent = "Nenhum dia selecionado";
      eventsList.innerHTML =
        "<p>Selecione um dia no calendário para ver os agendamentos.</p>";
      return;
    }

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    selectedDateElement.textContent = selectedDate.toLocaleDateString(
      "pt-BR",
      options
    );

    const dayBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === selectedDate.toDateString();
    });

    if (dayBookings.length === 0) {
      eventsList.innerHTML = "<p>Não há agendamentos para este dia.</p>";
      return;
    }

    eventsList.innerHTML = "";
    dayBookings.forEach((booking) => {
      const eventElement = document.createElement("div");
      eventElement.className = "event-item";
      eventElement.innerHTML = `
                <h4>${booking.eventName}</h4>
                <p><strong>Recurso:</strong> ${getResourceName(
                  booking.resource
                )}</p>
                <p><strong>Horário:</strong> ${booking.startTime} - ${
        booking.endTime
      }</p>
                <p><strong>Solicitante:</strong> ${booking.requester}</p>
            `;

      eventElement.addEventListener("click", () => {
        showBookingDetails(booking);
      });

      eventsList.appendChild(eventElement);
    });
  }

  function getResourceName(resourceKey) {
    const resources = {
      salao: "Salão Principal",
      "sala-reuniao": "Sala de Reuniões",
      quadra: "Quadra",
      cozinha: "Cozinha",
      audio: "Equipamento de Áudio",
      projetor: "Projetor",
    };

    return resources[resourceKey] || resourceKey;
  }

  function showBookingDetails(booking) {
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    modalTitle.textContent = booking.eventName;
    modalBody.innerHTML = `
            <p><strong>Data:</strong> ${new Date(
              booking.date
            ).toLocaleDateString("pt-BR")}</p>
            <p><strong>Horário:</strong> ${booking.startTime} - ${
      booking.endTime
    }</p>
            <p><strong>Recurso:</strong> ${getResourceName(
              booking.resource
            )}</p>
            <p><strong>Solicitante:</strong> ${booking.requester}</p>
            <p><strong>Contato:</strong> ${booking.contact}</p>
            <p><strong>Descrição:</strong> ${
              booking.description || "Nenhuma descrição fornecida."
            }</p>
        `;

    selectedBookingId = booking.id;
    eventModal.style.display = "block";
  }

  function setupEventListeners() {
    prevMonthButton.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
      updateDayEvents();
    });

    nextMonthButton.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
      updateDayEvents();
    });

    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const newBooking = {
        id: Date.now().toString(),
        eventName: document.getElementById("event-name").value,
        date: document.getElementById("event-date").value,
        startTime: document.getElementById("start-time").value,
        endTime: document.getElementById("end-time").value,
        resource: document.getElementById("resource").value,
        requester: document.getElementById("requester").value,
        contact: document.getElementById("contact").value,
        description: document.getElementById("description").value,
        status: "pending",
      };

      if (hasBookingConflict(newBooking)) {
        alert(
          "Conflito de agendamento! Já existe um agendamento para este recurso no horário selecionado."
        );
        return;
      }

      bookings.push(newBooking);
      saveBookings();

      alert("Agendamento solicitado com sucesso! Aguarde a confirmação.");
      bookingForm.reset();

      renderCalendar();
      if (
        selectedDate &&
        new Date(newBooking.date).toDateString() === selectedDate.toDateString()
      ) {
        updateDayEvents();
      }
    });

    closeModal.addEventListener("click", () => {
      eventModal.style.display = "none";
    });

    cancelBookingButton.addEventListener("click", () => {
      if (
        selectedBookingId &&
        confirm("Tem certeza que deseja cancelar este agendamento?")
      ) {
        bookings = bookings.filter(
          (booking) => booking.id !== selectedBookingId
        );
        saveBookings();
        eventModal.style.display = "none";
        renderCalendar();
        updateDayEvents();
      }
    });

    window.addEventListener("click", (e) => {
      if (e.target === eventModal) {
        eventModal.style.display = "none";
      }
    });
  }

  function hasBookingConflict(newBooking) {
    return bookings.some((booking) => {
      if (booking.resource !== newBooking.resource) return false;

      if (booking.date !== newBooking.date) return false;

      const newStart = timeToMinutes(newBooking.startTime);
      const newEnd = timeToMinutes(newBooking.endTime);
      const existingStart = timeToMinutes(booking.startTime);
      const existingEnd = timeToMinutes(booking.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });
  }

  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function saveBookings() {
    localStorage.setItem("churchBookings", JSON.stringify(bookings));
  }
});
