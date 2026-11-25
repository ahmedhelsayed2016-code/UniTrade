import { useState } from 'react'

export default function PhotoUpload({ name, label, onChange }) {
  const [fileName, setFileName] = useState('')

  return (
    <div className="register-field photo-field">
      <label htmlFor={name}>{label}</label>
      <div className="photo-upload">
        <span className="photo-upload-action" aria-hidden="true">Choose photo</span>
        <span className="photo-upload-name" aria-live="polite">{fileName || 'No photo selected'}</span>
        <input id={name} name={name} type="file" accept="image/jpeg,image/png,image/webp"
          aria-describedby={`${name}-hint`} onChange={event => {
            setFileName(event.currentTarget.files[0]?.name ?? '')
            onChange?.(event)
          }} />
      </div>
      <small id={`${name}-hint`}>Optional · JPG, PNG, or WebP · Up to 512 KB</small>
    </div>
  )
}
