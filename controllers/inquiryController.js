import Inquiry from '../models/Inquiry.js';
import { sendInquiryEmail } from '../utils/emailService.js';

/**
 * Create a new inquiry
 * POST /api/inquiries
 */
export const createInquiry = async (req, res) => {
  try {
    const { name, phone, email, checkIn, checkOut, rooms, adults, children } = req.body;

    // Validate required fields
    if (!name || !phone || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, checkIn, checkOut'
      });
    }

    // Create inquiry
    const inquiry = new Inquiry({
      name,
      phone,
      email: email || '',
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      rooms: parseInt(rooms) || 1,
      adults: parseInt(adults) || 2,
      children: parseInt(children) || 0,
      status: 'new'
    });

    const savedInquiry = await inquiry.save();

    // Send email notification (don't block the response if email fails)
    try {
      await sendInquiryEmail({
        name,
        phone,
        email,
        checkIn,
        checkOut,
        rooms: savedInquiry.rooms,
        adults: savedInquiry.adults,
        children: savedInquiry.children
      });
    } catch (emailError) {
      console.error('Failed to send inquiry email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      data: savedInquiry
    });

  } catch (error) {
    console.error('Error creating inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create inquiry',
      error: error.message
    });
  }
};

/**
 * Get all inquiries
 * GET /api/inquiries
 */
export const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries',
      error: error.message
    });
  }
};

/**
 * Update inquiry status
 * PUT /api/inquiries/:id
 */
export const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { status, notes, ...(notes && { notes }) },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inquiry',
      error: error.message
    });
  }
};






