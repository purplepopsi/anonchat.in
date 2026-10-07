const rooms = [
  ["late-night", "Late night", "Thoughts that only show up after dark."],
  ["music", "Music", "Songs, sounds, and everything in between."],
  ["relationships", "Relationships", "The good, the messy, the in-between."],
  ["gaming", "Gaming", "Games are better together."],
  ["movies", "Movies & TV", "Stay a little longer after the credits."],
  ["books", "Books", "One more chapter, one more conversation."],
  ["tech", "Tech", "For the endlessly curious."],
  ["sports", "Sports", "Every game has a story."],
].map(([id, name, description]) => ({ id, name, description, online: 0 }))

const messages = {}
const reactions = ["👍", "❤️", "😂", "😮"]
let activeRoom = rooms[0]
let replyingTo = null
let currentScreen = "home"

const $ = (selector) => document.querySelector(selector)
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character])

const app = $("#app")
const screens = {
  home: $("#homeScreen"),
  rooms: $("#roomsScreen"),
  chat: $("#chatScreen"),
}

function showScreen(name) {
  currentScreen = name
  Object.entries(screens).forEach(([key, element]) => {
    element.hidden = key !== name
  })
  app.className = `app app-${name}`
  $("#backButton").hidden = name === "home"
  $("#backButton span").textContent = name === "chat" ? "Rooms" : "Home"
}

function arrow() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"></path></svg>`
}

function renderRooms() {
  const mine = rooms.filter((room) => room.createdByMe)
  const everyone = rooms.filter((room) => !room.createdByMe)
  $("#myRoomCount").textContent = mine.length
  $("#publicRoomCount").textContent = everyone.length
  $("#createRoomButton").hidden = mine.length > 0

  $("#myRooms").innerHTML = mine.map((room) => `
    <button class="personal-room-card" data-room="${escapeHtml(room.id)}">
      <span class="personal-room-topline"><span class="owned-label">CREATED BY YOU</span>${arrow()}</span>
      <span class="personal-room-name">${escapeHtml(room.name)}</span>
      <span class="personal-room-description">${escapeHtml(room.description)}</span>
      <span class="personal-room-online"><i></i>0 online</span>
    </button>
  `).join("")

  $("#publicRooms").innerHTML = everyone.map((room, index) => `
    <button class="room-row" data-room="${escapeHtml(room.id)}">
      <span class="room-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="room-details"><span class="room-name">${escapeHtml(room.name)}</span><span class="room-description">${escapeHtml(room.description)}</span></span>
      <span class="room-online"><i></i>0 online</span>
    </button>
  `).join("")
}

function openRoom(id) {
  activeRoom = rooms.find((room) => room.id === id)
  replyingTo = null
  $("#chatRoomName").textContent = activeRoom.name
  $("#chatOnline").textContent = "0 online"
  $("#messageInput").placeholder = `Message #${activeRoom.name.toLowerCase().replace(/\s+/g, "-")}`
  renderMessages()
  showScreen("chat")
}

function renderMessages(animate = true) {
  const roomMessages = messages[activeRoom.id] || []
  const chat = $("#chatMessages")
  chat.classList.toggle("no-message-motion", !animate)
  chat.innerHTML = `
    <div class="privacy-note"><span></span>Messages stay anonymous</div>
    ${roomMessages.length === 0 ? `<div class="empty-chat"><span class="empty-dot"></span><h2>No messages yet</h2><p>Start the conversation.</p></div>` : ""}
    ${roomMessages.map((message) => `
      <article class="message message-self">
        <div class="message-content">
          <div class="message-meta"><strong>You</strong><time>${escapeHtml(message.time)}</time></div>
          <div class="message-bubble">${message.replyTo ? `<div class="reply-quote"><span>Replying to</span><p>${escapeHtml(message.replyTo.text)}</p></div>` : ""}${escapeHtml(message.text)}</div>
          ${message.reactions.length ? `<div class="message-reactions">${message.reactions.map((reaction) => `<button data-action="react" data-id="${message.id}" data-reaction="${reaction}">${reaction}<span>1</span></button>`).join("")}</div>` : ""}
          <div class="message-controls">
            <button class="message-actions-trigger" data-action="menu" aria-expanded="false">Reply or react</button>
            <div class="message-actions">
              <button data-action="reply" data-id="${message.id}">Reply</button><span></span>
              ${reactions.map((reaction) => `<button class="reaction-option ${message.reactions.includes(reaction) ? "active" : ""}" data-action="react" data-id="${message.id}" data-reaction="${reaction}" aria-label="React with ${reaction}">${reaction}</button>`).join("")}
              <button class="message-actions-close" data-action="close" aria-label="Close reactions">×</button>
            </div>
          </div>
        </div>
      </article>
    `).join("")}
  `
  requestAnimationFrame(() => {
    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: animate ? "smooth" : "auto",
    })
  })
}

function toggleReaction(id, reaction) {
  const message = (messages[activeRoom.id] || []).find((item) => item.id === id)
  if (!message) return
  message.reactions = message.reactions.includes(reaction)
    ? message.reactions.filter((item) => item !== reaction)
    : [...message.reactions, reaction]
  renderMessages(false)
}

function updateReplyBanner() {
  $("#replyBanner").hidden = !replyingTo
  $("#replyText").textContent = replyingTo?.text || ""
}

function closeMessageMenus() {
  document.querySelectorAll(".message-controls.actions-open").forEach((controls) => {
    controls.classList.remove("actions-open")
    controls.querySelector(".message-actions-trigger")?.setAttribute("aria-expanded", "false")
  })
}

$("#homeButton").addEventListener("click", () => showScreen("home"))
$("#enterButton").addEventListener("click", () => {
  renderRooms()
  showScreen("rooms")
})
$("#backButton").addEventListener("click", () => {
  showScreen(currentScreen === "chat" ? "rooms" : "home")
})

$("#roomsScreen").addEventListener("click", (event) => {
  const button = event.target.closest("[data-room]")
  if (button) openRoom(button.dataset.room)
})

$("#createRoomButton").addEventListener("click", () => {
  $("#roomModal").hidden = false
  $("#roomName").focus()
})
$("#closeModal").addEventListener("click", () => { $("#roomModal").hidden = true })
$("#roomModal").addEventListener("click", (event) => {
  if (event.target === $("#roomModal")) $("#roomModal").hidden = true
})
$("#roomForm").addEventListener("submit", (event) => {
  event.preventDefault()
  const name = $("#roomName").value.trim()
  if (!name) return
  const room = {
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
    name,
    description: $("#roomDescription").value.trim() || "A new space for an open conversation.",
    online: 0,
    createdByMe: true,
  }
  rooms.unshift(room)
  event.target.reset()
  $("#roomModal").hidden = true
  renderRooms()
  openRoom(room.id)
})

$("#messageInput").addEventListener("input", (event) => {
  $("#sendButton").disabled = !event.target.value.trim()
  event.target.style.height = "auto"
  event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`
})
$("#messageInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    $("#composer").requestSubmit()
  }
})
$("#composer").addEventListener("submit", (event) => {
  event.preventDefault()
  const input = $("#messageInput")
  const text = input.value.trim()
  if (!text) return
  messages[activeRoom.id] ||= []
  messages[activeRoom.id].push({
    id: Date.now(),
    text,
    time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()),
    replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text } : null,
    reactions: [],
  })
  input.value = ""
  input.style.height = "auto"
  $("#sendButton").disabled = true
  replyingTo = null
  updateReplyBanner()
  renderMessages()
})

$("#chatMessages").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]")
  if (!button) return
  const id = Number(button.dataset.id)
  if (button.dataset.action === "menu") {
    const controls = button.closest(".message-controls")
    const shouldOpen = !controls.classList.contains("actions-open")
    closeMessageMenus()
    if (shouldOpen) {
      controls.classList.add("actions-open")
      button.setAttribute("aria-expanded", "true")
    }
    return
  }
  if (button.dataset.action === "close") {
    closeMessageMenus()
    return
  }
  if (button.dataset.action === "react") toggleReaction(id, button.dataset.reaction)
  if (button.dataset.action === "reply") {
    replyingTo = (messages[activeRoom.id] || []).find((message) => message.id === id)
    updateReplyBanner()
    closeMessageMenus()
    $("#messageInput").focus()
  }
})
$("#cancelReply").addEventListener("click", () => {
  replyingTo = null
  updateReplyBanner()
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMessageMenus()
    if (!$("#roomModal").hidden) $("#roomModal").hidden = true
  }
})
document.addEventListener("click", (event) => {
  if (!event.target.closest(".message-controls")) closeMessageMenus()
})

const names = ["QuietPine", "SoftEcho", "MossMoon", "FernFox", "CloudAtlas"]
$("#nickname").textContent = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(10 + Math.random() * 90)}`
renderRooms()
