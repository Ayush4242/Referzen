const router = require("express").Router();
const Message = require("../models/Message");
const Referral = require("../models/Referral");

// Get all conversations for a user
router.get("/conversations", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    // Find all unique users this user has messaged or received messages from
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
    .populate("sender", "name role profileScore")
    .populate("receiver", "name role profileScore")
    .sort({ createdAt: -1 });

    let conversations = {};
    messages.forEach((msg) => {
      const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      if (!conversations[otherUser._id]) {
        conversations[otherUser._id] = {
          user: otherUser,
          lastMessage: msg.content,
          updatedAt: msg.createdAt,
          unreadCount: (!msg.isRead && msg.receiver._id.toString() === userId) ? 1 : 0,
        };
      } else if (!msg.isRead && msg.receiver._id.toString() === userId) {
        conversations[otherUser._id].unreadCount++;
      }
    });

    // If no conversations found, suggest them based on active referrals
    if (Object.keys(conversations).length === 0) {
      const referrals = await Referral.find({
        $or: [{ student: userId }, { referrer: userId }],
      })
      .populate("student", "name role")
      .populate("referrer", "name role");

      referrals.forEach((ref) => {
        const otherUser = ref.student._id.toString() === userId ? ref.referrer : ref.student;
        if (otherUser && !conversations[otherUser._id]) {
          conversations[otherUser._id] = {
            user: otherUser,
            lastMessage: "Start a conversation regarding the " + ref.company + " referral.",
            updatedAt: ref.createdAt,
            unreadCount: 0,
            referralId: ref._id,
          };
        }
      });
    }

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for a specific conversation
router.get("/thread/:otherUserId", async (req, res) => {
  const { userId } = req.query;
  const { otherUserId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
    .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post("/send", async (req, res) => {
  const { sender, receiver, content, referralId } = req.body;

  try {
    const newMessage = new Message({
      sender,
      receiver,
      content,
      referralId,
    });
    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
