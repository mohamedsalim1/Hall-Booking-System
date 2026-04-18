import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title fade-in-up">رحلتك نحو الفخامة تبدأ هنا</h1>
          <p className="hero-subtitle fade-in-up delay-1">
            صالة احتفالات استثنائية مصممة لأصحاب الذوق الرفيع. اجعل مناسبتك القادمة لا تُنسى في أجواء تنبض بالرقي والفخامة.
          </p>
          <div className="hero-actions fade-in-up delay-2">
            <button className="action-button luxury-btn" onClick={() => navigate('/booking/step1')}>
              احجز تاريخك الآن
            </button>
            <button className="secondary-button outline-btn" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
              استكشف خدماتنا
            </button>
          </div>
        </div>
      </section>

      {/* Intro / Why Choose Us */}
      <section className="why-choose-us section-padding">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">معايير ذهبية للاحتفاء بمناسباتك</h2>
            <div className="gold-separator"></div>
            <p className="section-desc">
              نلتزم بتقديم تجربة تفوق التوقعات، حيث نجمع بين العراقة الأصيلة والحداثة المترفة في أدق التفاصيل لتتويج لحظاتك السعيدة.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3 className="feature-title">تصميم ملكي</h3>
              <p>مساحات رحبة وثريات كريستالية ساحرة تعكس أجواءً استثنائية من الرومانسية.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3 className="feature-title">ضيافة 5 نجوم</h3>
              <p>طهاة عالميون لتقديم أشهى القوائم التي ترضي أصالتك العالية وترتقي لاحتفالك.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👑</div>
              <h3 className="feature-title">خدمة استثنائية</h3>
              <p>فريق محترف ومتفاني لضمان سير مناسبتك بكل سلاسة ودقة متناهية النظير.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>مستعد لتنظيم ليلة أحلامك؟</h2>
          <p>تواصل مع مستشاري الحفلات لدينا لبدء رحلة التخطيط</p>
          <Link to="/booking/step1" className="action-button luxury-btn mt-4">
             ابدأ حجزك الآن
          </Link>
        </div>
      </section>

      {/* Footer Placeholder for Landing */}
      <footer className="luxury-footer">
        <div className="footer-content">
          <div className="brand-crest large-crest mb-4">O</div>
          <h3>نظام الحجوزات الاستثنائي</h3>
          <p className="text-muted">نصنع ذكريات لا تتلاشى بأسلوب فاخر.</p>
          <div className="footer-links">
            <Link to="/admin/dashboard" className="text-muted">بوابة الإدارة</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
