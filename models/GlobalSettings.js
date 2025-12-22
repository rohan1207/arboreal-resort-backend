import mongoose from 'mongoose';

const globalSettingsSchema = new mongoose.Schema(
  {
    discountAmount: {
      type: Number,
      default: 1500,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['amount', 'percentage'],
      default: 'amount', // 'amount' for flat ₹ discount, 'percentage' for % discount
    },
    discountValue: {
      type: Number,
      default: 1500, // For amount: ₹1500, For percentage: 20 means 20%
      min: 0,
      validate: {
        validator: function(value) {
          // If discountType is percentage, value should be <= 100
          if (this.discountType === 'percentage' && value > 100) {
            return false;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 100%'
      }
    },
    bookingPolicy: {
      type: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },
          content: {
            type: String,
            required: true,
            trim: true,
          },
          displayOrder: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [
        {
          title: 'Cancellation policy',
          content: 'Cancellation between 15 days and the day before arrival (within 12:00pm local time) will incur 50% charge plus taxes. Cancellation within 24 hours before the arrival date (from 12:00pm local time), early departure, no show will incur 100% charge plus taxes.',
          displayOrder: 0,
        },
        {
          title: 'Extra occupancy policy',
          content: 'All rooms are configured for a maximum occupancy of 2 guests. For bookings made for 3 guests, an extra mattress will be arranged and additional charges will apply.',
          displayOrder: 1,
        },
        {
          title: 'Guarantee policy',
          content: 'Valid credit card details required to guarantee reservation. Full prepayment required 15 days prior to arrival.',
          displayOrder: 2,
        },
        {
          title: 'Children policy',
          content: 'Children aged 11 years and older are fully charged.',
          displayOrder: 3,
        },
        {
          title: 'Check in policy',
          content: 'Check-in after 2:00 pm. Check-out before 12:00 pm.',
          displayOrder: 4,
        },
        {
          title: 'Pet policy',
          content: 'Small pets are allowed with prior approval by the property.',
          displayOrder: 5,
        },
      ],
    },
    activitiesEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

globalSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

export default GlobalSettings;


