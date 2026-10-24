import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, AlertCircle, CheckCircle2, MapPin, Camera, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { productService } from '../services/productService.js';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import api from '../services/api.js';
import './PublishItem.css';

const CATEGORIES = [
  { id: 'camisetas', label: 'Camisetas de Fútbol' },
  { id: 'buzos', label: 'Buzos & Hoodies' },
  { id: 'remeras', label: 'Remeras & Musculosas' },
  { id: 'camperas', label: 'Camperas & Abrigos' },
  { id: 'pantalones', label: 'Pantalones & Jeans' },
  { id: 'bermudas', label: 'Bermudas & Shorts' },
  { id: 'calzado', label: 'Zapatillas & Calzado' },
  { id: 'accesorios', label: 'Accesorios & Gorras' },
];

const STYLES = [
  { id: 'deportivo', label: 'Deportivo / Fútbol' },
  { id: 'streetwear', label: 'Streetwear & Oversized' },
  { id: 'casual', label: 'Casual Urbano' },
  { id: 'vintage', label: 'Vintage / Retro' },
  { id: 'formal', label: 'Formal / Elegante' },
];

const GENDERS = [
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'unisex', label: 'Unisex' },
  { id: 'ninos', label: 'Niños' },
];

const CONDITIONS = [
  { id: 'nuevo', label: 'Nuevo con etiqueta' },
  { id: 'como_nuevo', label: 'Como nuevo (1-2 usos)' },
  { id: 'muy_bueno', label: 'Muy bueno (poco uso)' },
  { id: 'bueno', label: 'Buen estado general' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44'];

export function PublishItem() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('camisetas');
  const [style, setStyle] = useState('deportivo');
  const [gender, setGender] = useState('unisex');
  const [size, setSize] = useState('L');
  const [condition, setCondition] = useState('como_nuevo');
  const [description, setDescription] = useState('');
  const [locationCity, setLocationCity] = useState(user?.location_city || 'Buenos Aires');

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle image selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 6) {
      setError('Solo podés subir hasta un máximo de 6 fotos.');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setError('');
  };

  const removeImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Debés subir al menos una foto real de la prenda.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Upload images
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append('images', f));

      const uploadRes = await api.post('/upload/product-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrls = uploadRes.data.urls || [];

      // 2. Create product
      const productRes = await productService.createProduct({
        title,
        brand,
        category,
        style,
        gender,
        size,
        condition,
        description,
        location_city: locationCity,
        images: imageUrls,
      });

      setSuccess('¡Prenda publicada exitosamente! Redirigiendo a la publicación...');
      setTimeout(() => {
        navigate(`/prenda/${productRes.product.id}`);
      }, 1100);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error al publicar la prenda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container sv-publish-page animate-fade-in">
      <div className="sv-publish-header">
        <h1 className="sv-publish-title">PUBLICAR PRENDA</h1>
        <p className="sv-publish-subtitle">
          Subí fotos reales y completá sus características para que la comunidad te proponga trueques directos.
        </p>
      </div>

      {error && (
        <div className="sv-auth-alert sv-auth-alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="sv-auth-alert sv-auth-alert-success">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sv-publish-form">
        {/* Section 1: Photos */}
        <div className="sv-form-section">
          <div className="sv-form-section-header">
            <span className="sv-form-section-step">PASO 1</span>
            <label className="sv-form-section-label">
              FOTOGRAFÍAS REALES ({selectedFiles.length}/6)
            </label>
          </div>
          <p className="sv-form-section-desc">
            Subí fotos nítidas con buena luz. La primera foto será utilizada como portada en el catálogo.
          </p>

          <div className="sv-previews-grid">
            {previews.map((url, i) => (
              <div key={i} className="sv-preview-card">
                <img src={url} alt={`Previa ${i + 1}`} className="sv-preview-img" />
                <button
                  type="button"
                  className="sv-preview-delete"
                  onClick={() => removeImage(i)}
                  aria-label="Eliminar foto"
                  title="Eliminar foto"
                >
                  <X size={14} />
                </button>
                {i === 0 && <span className="sv-cover-tag">PORTADA</span>}
              </div>
            ))}

            {selectedFiles.length < 6 && (
              <label className="sv-upload-dropzone">
                <div className="sv-upload-icon-circle">
                  <Camera size={22} className="sv-upload-icon" />
                </div>
                <span className="sv-upload-text">Subir fotos</span>
                <span className="sv-upload-subtext">JPG, PNG o WebP hasta 5MB</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sv-file-input"
                />
              </label>
            )}
          </div>
        </div>

        {/* Section 2: Garment Information */}
        <div className="sv-form-section">
          <div className="sv-form-section-header">
            <span className="sv-form-section-step">PASO 2</span>
            <label className="sv-form-section-label">DETALLES Y CARACTERÍSTICAS</label>
          </div>

          <div className="sv-form-row">
            <Input
              label="Título de la publicación"
              placeholder="Ej: Camiseta Boca Juniors Titular 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Marca"
              placeholder="Ej: Adidas, Nike, Zara, Vintage..."
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="sv-form-grid-4">
            <div className="sv-input-group">
              <label className="sv-input-label">Tipo de prenda</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="sv-sort-select"
                style={{ width: '100%' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="sv-input-group">
              <label className="sv-input-label">Estilo</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="sv-sort-select"
                style={{ width: '100%' }}
              >
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="sv-input-group">
              <label className="sv-input-label">Género</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="sv-sort-select"
                style={{ width: '100%' }}
              >
                {GENDERS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="sv-input-group">
              <label className="sv-input-label">Talle</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="sv-sort-select"
                style={{ width: '100%' }}
              >
                {SIZES.map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sv-form-row">
            <div className="sv-input-group">
              <label className="sv-input-label">Estado de la prenda</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="sv-sort-select"
                style={{ width: '100%' }}
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.id} value={cond.id}>{cond.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Localidad / Zona"
              placeholder="Ej: Palermo, CABA o Ramos Mejía"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              leftIcon={<MapPin size={16} />}
              required
            />
          </div>

          <div className="sv-input-group">
            <label className="sv-input-label">Descripción detallada</label>
            <textarea
              rows={4}
              placeholder="Indicá medidas aproximadas, detalles de confección, si tiene algún desgaste o qué tipo de prendas te interesaría recibir a cambio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sv-input-field"
              style={{
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                height: 'auto',
                resize: 'vertical',
              }}
              required
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="sv-publish-submit-bar">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="sv-publish-submit-btn"
          >
            PUBLICAR PRENDA AHORA
          </Button>
        </div>
      </form>
    </div>
  );
}