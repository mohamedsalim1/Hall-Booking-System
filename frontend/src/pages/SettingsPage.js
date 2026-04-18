import React, { useState, useEffect } from 'react';
import {
  fetchHalls,
  createHall,
  updateHall,
  deleteHall,
  fetchTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  fetchEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
  fetchServices,
  createService,
  updateService,
  deleteService,
} from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import './SettingsPage.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('halls');
  const [halls, setHalls] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [services, setServices] = useState([]);

  const tabLabels = {
    halls: 'الصالات',
    timeSlots: 'المواعيد',
    eventTypes: 'أنواع الفعاليات',
    services: 'الخدمات',
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [hallsData, timeSlotsData, eventTypesData, servicesData] = await Promise.all([
        fetchHalls(),
        fetchTimeSlots(),
        fetchEventTypes(),
        fetchServices()
      ]);
      setHalls(hallsData);
      setTimeSlots(timeSlotsData);
      setEventTypes(eventTypesData);
      setServices(servicesData);
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل في تحميل بيانات الإعدادات. يرجى التأكد من تشغيل الخادم.';
      setError(msg);
      console.error('Error fetching settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null, type) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : getDefaultFormData(type));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const getDefaultFormData = (type) => {
    switch (type) {
      case 'halls':
        return { name: '', capacity: '', price: '', tablePrice: '', description: '' };
      case 'timeSlots':
        return { name: '', startTime: '', endTime: '', price: '' };
      case 'eventTypes':
        return { name: '', description: '' };
      case 'services':
        return { name: '', price: '', description: '' };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update
        switch (activeTab) {
          case 'halls':
            const updatedHall = await updateHall(editingItem.id, formData);
            setHalls(halls.map(h => h.id === editingItem.id ? { ...h, ...updatedHall } : h));
            break;
          case 'timeSlots':
            const updatedTimeSlot = await updateTimeSlot(editingItem.id, formData);
            setTimeSlots(timeSlots.map(t => t.id === editingItem.id ? { ...t, ...updatedTimeSlot } : t));
            break;
          case 'eventTypes':
            const updatedEventType = await updateEventType(editingItem.id, formData);
            setEventTypes(eventTypes.map(et => et.id === editingItem.id ? { ...et, ...updatedEventType } : et));
            break;
          case 'services':
            const updatedService = await updateService(editingItem.id, formData);
            setServices(services.map(s => s.id === editingItem.id ? { ...s, ...updatedService } : s));
            break;
        }
      } else {
        // Create
        switch (activeTab) {
          case 'halls':
            const newHall = await createHall(formData);
            setHalls([...halls, newHall]);
            break;
          case 'timeSlots':
            const newTimeSlot = await createTimeSlot(formData);
            setTimeSlots([...timeSlots, newTimeSlot]);
            break;
          case 'eventTypes':
            const newEventType = await createEventType(formData);
            setEventTypes([...eventTypes, newEventType]);
            break;
          case 'services':
            const newService = await createService(formData);
            setServices([...services, newService]);
            break;
        }
      }
      closeModal();
    } catch (err) {
      console.error('Error saving item:', err);
      alert(err.response?.data?.message || 'فشل في حفظ البيانات. حاول مرة أخرى.');
    }
  };

  const handleDelete = async (item, type) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا العنصر؟')) return;

    try {
      switch (type) {
        case 'halls':
          await deleteHall(item.id);
          setHalls(halls.filter(h => h.id !== item.id));
          break;
        case 'timeSlots':
          await deleteTimeSlot(item.id);
          setTimeSlots(timeSlots.filter(t => t.id !== item.id));
          break;
        case 'eventTypes':
          await deleteEventType(item.id);
          setEventTypes(eventTypes.filter(et => et.id !== item.id));
          break;
        case 'services':
          await deleteService(item.id);
          setServices(services.filter(s => s.id !== item.id));
          break;
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err.response?.data?.message || 'فشل حذف العنصر. حاول مرة أخرى.');
    }
  };

  const renderTable = (data, columns, type) => (
    <div className="settings-table-container">
      <div className="table-header">
        <h3>{tabLabels[type]}</h3>
        <Button
          onClick={() => openModal(null, type)}
          className="btn-primary"
        >
          إضافة جديد
        </Button>
      </div>
      <table className="settings-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </td>
              ))}
              <td>
                <div className="action-buttons">
                  <Button
                    onClick={() => openModal(item, type)}
                    className="btn-secondary btn-small"
                  >
                    تعديل
                  </Button>
                  <Button
                    onClick={() => handleDelete(item, type)}
                    className="btn-danger btn-small"
                  >
                    حذف
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const hallColumns = [
    { key: 'name', label: 'الاسم' },
    { key: 'capacity', label: 'السعة' },
    { key: 'price', label: 'سعر الصالة', render: (value) => `${value} دولار أمريكي` },
    { key: 'tablePrice', label: 'سعر الطاولة', render: (value) => `${value || 0} دولار أمريكي` },
    { key: 'description', label: 'الوصف' }
  ];

  const timeSlotColumns = [
    { key: 'startTime', label: 'وقت البداية' },
    { key: 'endTime', label: 'وقت النهاية' },
    { key: 'price', label: 'السعر', render: (value) => `${value} دولار أمريكي` }
  ];

  const eventTypeColumns = [
    { key: 'name', label: 'الاسم' },
    { key: 'description', label: 'الوصف' }
  ];

  const serviceColumns = [
    { key: 'name', label: 'الاسم' },
    { key: 'price', label: 'السعر', render: (value) => `${value} دولار أمريكي` },
    { key: 'description', label: 'الوصف' }
  ];

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">جارٍ تحميل الإعدادات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>الإعدادات</h1>
      </div>

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'halls' ? 'active' : ''}`}
          onClick={() => setActiveTab('halls')}
        >
          الصالات
        </button>
        <button
          className={`tab-button ${activeTab === 'timeSlots' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeSlots')}
        >
          المواعيد
        </button>
        <button
          className={`tab-button ${activeTab === 'eventTypes' ? 'active' : ''}`}
          onClick={() => setActiveTab('eventTypes')}
        >
          أنواع الفعاليات
        </button>
        <button
          className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          الخدمات
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'halls' && renderTable(halls, hallColumns, 'halls')}
        {activeTab === 'timeSlots' && renderTable(timeSlots, timeSlotColumns, 'timeSlots')}
        {activeTab === 'eventTypes' && renderTable(eventTypes, eventTypeColumns, 'eventTypes')}
        {activeTab === 'services' && renderTable(services, serviceColumns, 'services')}
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={`${editingItem ? 'تعديل' : 'إضافة'} ${tabLabels[activeTab]}`}>
        <form onSubmit={handleSubmit} className="settings-form">
          {activeTab === 'halls' && (
            <>
              <div className="form-group">
                <label>الاسم</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>السعة</label>
                <input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>سعر الصالة (ثابت)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>سعر الطاولة الفردي</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tablePrice || ''}
                  onChange={(e) => setFormData({ ...formData, tablePrice: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
            </>
          )}

          {activeTab === 'timeSlots' && (
            <>
              <div className="form-group">
                <label>بداية الفترة</label>
                <input
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>نهاية الفترة</label>
                <input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>السعر</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          {activeTab === 'eventTypes' && (
            <>
              <div className="form-group">
                <label>الاسم</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
            </>
          )}

          {activeTab === 'services' && (
            <>
              <div className="form-group">
                <label>الاسم</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>السعر</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <Button type="button" onClick={closeModal} className="btn-secondary">
              إلغاء
            </Button>
            <Button type="submit" className="btn-primary">
              {editingItem ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;