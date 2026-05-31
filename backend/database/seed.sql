INSERT INTO drops (
  public_code,
  title,
  message,
  latitude,
  longitude,
  radius_meters,
  keyword_hash,
  has_keyword,
  expires_at
)
VALUES
(
  'HD-DEMO01',
  'Drop demo sin clave',
  'Este es un mensaje demo de Hermes Drop. Si lo estás leyendo, estás dentro del rango correcto.',
  -34.603722,
  -58.381592,
  500,
  NULL,
  FALSE,
  NOW() + INTERVAL '7 days'
)
ON CONFLICT (public_code) DO NOTHING;