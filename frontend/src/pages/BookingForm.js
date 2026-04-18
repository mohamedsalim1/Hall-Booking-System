import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import { createBooking, fetchHalls, fetchEventTypes, fetchTimeSlots, fetchServices } from '../services/api';
import { formatCurrency } from '../utils/format';
import './BookingForm.css';

const BookingForm = ({ halls, eventTypes: propEventTypes, timeSlots: propTimeSlots, services: propServices, preselectedHall, preselectedDate, onSuccess }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const isPublicFlow = true; // For styling distinction

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    eventTypeId: '',
    hallId: preselectedHall?.id || '',
    date: preselectedDate || '',
    timeSlotId: '',
    numberOfTables: '',
    guestCount: '',
    tablePrice: '',
    notes: '',
    serviceIds: [],
  });

  const [calculatedData, setCalculatedData] = useState({
    totalGuests: 0,
    totalAmount: 0,
    breakdown: { hall: 0, timeSlot: 0, services: 0 },
  });

  const [eventTypes, setEventTypes] = useState(propEventTypes || []);
  const [timeSlots, setTimeSlots] = useState(propTimeSlots || []);
  const [services, setServices] = useState(propServices || []);
  const [hallsList, setHallsList] = useState(halls || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [hallsData, eventTypesData, timeSlotsData, servicesData] = await Promise.all([
          (!halls || halls.length === 0) ? fetchHalls() : Promise.resolve(halls),
          (propEventTypes && propEventTypes.length > 0) ? Promise.resolve(propEventTypes) : fetchEventTypes(),
          (propTimeSlots && propTimeSlots.length > 0) ? Promise.resolve(propTimeSlots) : fetchTimeSlots(),
          (propServices && propServices.length > 0) ? Promise.resolve(propServices) : fetchServices(),
        ]);
        setHallsList(hallsData);
        setEventTypes(eventTypesData);
        setTimeSlots(timeSlotsData);
        setServices(servicesData);
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Update tablePrice when hall changes
  useEffect(() => {
    if (formData.hallId) {
      const hall = hallsList.find(h => h.id === Number(formData.hallId));
      if (hall && !formData.tablePrice) { // Only auto-fill if currently empty or just selected
        setFormData(prev => ({ ...prev, tablePrice: hall.tablePrice || 0 }));
      }
    }
  }, [formData.hallId, hallsList]);

  useEffect(() => {
    const hall = hallsList.find(h => h.id === Number(formData.hallId));
    const timeSlot = timeSlots.find(t => t.id === Number(formData.timeSlotId));
    const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
    const tables = Number(formData.numberOfTables) || 0;

    if (hall && tables > 0) {
      const hallFlatPrice = hall.price || 0;
      const appliedTablePrice = Number(formData.tablePrice) || 0;
      const tableTotal = tables * appliedTablePrice;
      const timeSlotTotal = timeSlot ? timeSlot.price : 0;
      const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);

      const totalAmount = hallFlatPrice + tableTotal + timeSlotTotal + servicesTotal;
      const totalGuests = Number(formData.guestCount) || (tables * 10);

      setCalculatedData({
        totalGuests,
        totalAmount,
        breakdown: {
          hall: hallFlatPrice,
          tables: tableTotal,
          timeSlot: timeSlotTotal,
          services: servicesTotal
        }
      });
    } else {
      setCalculatedData({
        totalGuests: 0,
        totalAmount: 0,
        breakdown: { hall: 0, tables: 0, timeSlot: 0, services: 0 }
      });
    }
  }, [formData.hallId, formData.timeSlotId, formData.numberOfTables, formData.serviceIds, hallsList, timeSlots, services]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (serviceId, checked) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: checked
        ? [...prev.serviceIds, Number(serviceId)]
        : prev.serviceIds.filter(id => id !== Number(serviceId))
    }));
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const handleNextStep1 = () => {
    if (!formData.eventTypeId || !formData.hallId || !formData.date || !formData.timeSlotId || !formData.numberOfTables) {
      alert("يرجى ملء جميع الحقول المطلوبة (نوع المناسبة، القاعة، التاريخ، الفترة، عدد الطاولات) للمتابعة.");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (!formData.customerName || !formData.customerPhone) {
      alert("يرجى إدخال الاسم الكريم ورقم الهاتف للمتابعة.");
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      await createBooking({
        ...formData,
        eventTypeId: Number(formData.eventTypeId),
        hallId: Number(formData.hallId),
        timeSlotId: Number(formData.timeSlotId),
        numberOfTables: Number(formData.numberOfTables),
        guestCount: Number(formData.guestCount) || (Number(formData.numberOfTables) * 10),
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Success page or redirect
        alert("تم الحجز بنجاح. شكراً لاختياركم قصر اليزن للمناسبات");
        setCurrentStep(5);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إرسال الحجز.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hallOptions = hallsList.map(hall => ({ value: hall.id, label: hall.name }));
  const eventTypeOptions = eventTypes.map(et => ({ value: et.id, label: et.name }));
  const timeSlotOptions = timeSlots.map(ts => ({ value: ts.id, label: ts.name }));

  if (isLoading) {
    return (
      <div className="luxury-booking-container">
        <div className="form-loading">
          <div className="loading-spinner"></div>
          <p>جاري تحميل بيانات الحجز...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentStep) / 4) * 100;

  return (
    <div className="luxury-booking-container">
      <div className="booking-progress-wrapper">
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="progress-steps-label">الخطوة {Math.min(currentStep, 4)} من 4</div>
      </div>

      <div className="luxury-booking-content fade-in-up">
        <div className="form-header luxury-header">
          <h1>{currentStep === 1 ? 'تفاصيل المناسبة' : currentStep === 2 ? 'البيانات الشخصية' : currentStep === 3 ? 'رُقي الخدمات' : currentStep === 4 ? 'تأكيد الحجز' : 'تم بنجاح'}</h1>
          <p>{currentStep === 1 ? 'اختر المساحة والوقت اللذين يخلدان مناسبتك' : currentStep === 2 ? 'من فضلك أخبرنا بالمزيد عنك' : currentStep === 3 ? 'أضف لمسات الفخامة إلى أمسيتك' : currentStep === 4 ? 'راجع تفاصيل مناسبتك لتأكيد الحجز النهائي' : 'تم اضافة حجز جديد بنجاح'}</p>
        </div>

        <form onSubmit={e => e.preventDefault()} className="luxury-form-wrapper">
          {currentStep === 1 && (
            <Card className="luxury-card">
              <div className="form-group">
                <label>نوع المناسبة</label>
                <Select options={eventTypeOptions} value={formData.eventTypeId} onChange={(value) => handleChange('eventTypeId', value)} placeholder="اختر نوع المناسبة" />
              </div>
              <div className="form-group">
                <label>القاعة المذهلة</label>
                <Select options={hallOptions} value={formData.hallId} onChange={(value) => handleChange('hallId', value)} placeholder="اختر القاعة التي تناسب ذوقك" />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>تاريخ الليلة الموعودة</label>
                  <input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>فترة الاحتفال</label>
                  <Select options={timeSlotOptions} value={formData.timeSlotId} onChange={(value) => handleChange('timeSlotId', value)} placeholder="حدد الوقت المنشود" />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>عدد الطاولات</label>
                  <input type="number" min="1" value={formData.numberOfTables} onChange={(e) => handleChange('numberOfTables', e.target.value)} placeholder="مثال: 30" />
                </div>
                <div className="form-group">
                  <label>سعر الطاولة (ل.س)</label>
                  <input type="number" min="0" step="0.01" value={formData.tablePrice} onChange={(e) => handleChange('tablePrice', e.target.value)} placeholder="السعر لكل طاولة" />
                </div>
              </div>
              <div className="form-group">
                <label>إجمالي عدد الضيوف (اختياري)</label>
                <input type="number" min="1" value={formData.guestCount} onChange={(e) => handleChange('guestCount', e.target.value)} placeholder="يترك فارغاً للحساب التلقائي" />
              </div>
              <div className="luxury-form-actions mt-4">
                <button type="button" className="action-button luxury-btn w-full" onClick={handleNextStep1}>
                  الاستمرار للخطوة التالية
                </button>
              </div>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="luxury-card">
              <div className="form-group">
                <label>الاسم الكريم</label>
                <input type="text" value={formData.customerName} onChange={(e) => handleChange('customerName', e.target.value)} placeholder="أدخل اسمك الكريم" required />
              </div>
              <div className="form-group">
                <label>رقم هاتف التواصل</label>
                <input type="tel" value={formData.customerPhone} onChange={(e) => handleChange('customerPhone', e.target.value)} placeholder="05XXXXXXXX" required />
              </div>
              <div className="form-group">
                <label>ملاحظات خاصة (اختياري)</label>
                <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows="4" placeholder="هل لديك أي طلبات مميزة لجعل ليلتك استثنائية؟"></textarea>
              </div>
              <div className="luxury-form-actions flex-btn">
                <button type="button" className="secondary-button" onClick={prevStep}>رجوع</button>
                <button type="button" className="action-button luxury-btn" onClick={handleNextStep2}>الاستمرار نحو الإضافات</button>
              </div>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="luxury-card">
              <div className="services-luxury-grid">
                {services.map(service => (
                  <label key={service.id} className={`service-premium-item ${formData.serviceIds.includes(service.id) ? 'selected' : ''}`}>
                    <div className="service-header">
                      <input type="checkbox" checked={formData.serviceIds.includes(service.id)} onChange={(e) => handleServiceChange(service.id, e.target.checked)} />
                      <h4>{service.name}</h4>
                    </div>
                    {service.price && <span className="service-premium-price">+{formatCurrency(service.price)}</span>}
                  </label>
                ))}
              </div>
              <div className="luxury-form-actions flex-btn mt-4">
                <button type="button" className="secondary-button" onClick={prevStep}>رجوع</button>
                <button type="button" className="action-button luxury-btn" onClick={nextStep}>مراجعة الحجز</button>
              </div>
            </Card>
          )}

          {currentStep === 4 && (
            <Card className="luxury-card summary-card">
              <div className="receipt-container">
                <div className="receipt-item"><span>صاحب الحجز:</span> <strong>{formData.customerName}</strong></div>
                <div className="receipt-item"><span>التاريخ:</span> <strong>{formData.date}</strong></div>
                <div className="receipt-item"><span>سعر الطاولة:</span> <strong>{formatCurrency(formData.tablePrice)}</strong></div>
                <div className="receipt-item"><span>عدد الطاولات:</span> <strong>{formData.numberOfTables}</strong></div>
                <div className="receipt-item"><span>عدد الضيوف التقديري:</span> <strong>{calculatedData.totalGuests} ضيف</strong></div>
              </div>

              <div className="luxury-summary-total">
                <div className="summary-row">
                  <span style={{ color: '#d2a654' }}>الإجمالي</span>
                  <strong className="total-huge">{formatCurrency(calculatedData.totalAmount)}</strong>
                </div>
              </div>

              <div className="luxury-form-actions flex-btn mt-4">
                <button type="button" className="secondary-button outline-btn" onClick={prevStep} disabled={isSubmitting}>رجوع للتعديل</button>
                <button type="button" className="action-button luxury-btn flex-grow" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'جاري تأكيد مناسبتك...' : 'تأكيد الحجز الفاخر'}
                </button>
              </div>
            </Card>
          )}

          {currentStep === 5 && (
            <div className="success-luxury-msg text-center">
              <Button variant="secondary" className="mt-4" onClick={() => navigate('/')}>العودة للرئيسية</Button>
            </div>
          )}
        </form>
      </div>
    </div >
  );
};

export default BookingForm;