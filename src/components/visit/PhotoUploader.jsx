/**
 * PhotoUploader.jsx — 방문 인증 사진 임시 업로드·삭제 UI
 * - JPEG/PNG/WebP, 장당 5MB, 최대 5장. 드래그앤드롭과 파일 선택을 지원
 * - uploadTempPhoto / deleteTempPhoto로 임시 파일을 관리하고 미리보기는 resolveAssetUrl 사용
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useId, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import clsx from 'clsx';
import { deleteTempPhoto, uploadTempPhoto } from '../../api/visitApi';
import { getApiErrorMessage } from '../../api/http';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import styles from './PhotoUploader.module.scss';

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp';
const ACCEPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ACCEPT_EXT = /\.(jpe?g|png|webp)$/i;

function isAllowedImage(file) {
  if (!file || file.size <= 0) return false;
  if (ACCEPT_TYPES.has(file.type)) return true;
  return ACCEPT_EXT.test(file.name || '');
}

export function PhotoUploader({ photos, onChange, disabled = false, locked = false, variant = 'default' }) {
  useUiLanguage();
  const inputId = useId();
  const inputRef = useRef(null);
  const dragDepth = useRef(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const full = photos.length >= MAX_FILES;
  const blocked = locked || disabled || uploading || full;
  const remaining = Math.max(0, MAX_FILES - photos.length);

  async function addFiles(fileList) {
    if (locked || disabled || uploading) return;
    const incoming = Array.from(fileList || []).filter((file) => file && file.size > 0);
    if (!incoming.length) return;
    const allowed = incoming.filter(isAllowedImage);
    if (!allowed.length) {
      setError('JPEG, PNG, WebP 이미지만 올릴 수 있습니다.');
      return;
    }
    if (photos.length + allowed.length > MAX_FILES) {
      setError('사진은 최대 5장까지 올릴 수 있습니다.');
      return;
    }
    setError(allowed.length < incoming.length
      ? '이미지 파일만 올렸습니다. JPEG, PNG, WebP만 사용할 수 있습니다.'
      : '');
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of allowed) {
        if (file.size > MAX_BYTES) {
          throw new Error('사진 용량이 너무 큽니다. 파일당 5MB 이하로 올려 주세요.');
        }
        uploaded.push(await uploadTempPhoto(file, '현장 사진'));
      }
      onChange([...photos, ...uploaded]);
    } catch (err) {
      setError(err?.message?.startsWith('사진') ? err.message : getApiErrorMessage(err, '사진을 올리지 못했습니다.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function resetDrag() {
    dragDepth.current = 0;
    setDragging(false);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    if (blocked) return;
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = blocked ? 'none' : 'copy';
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    resetDrag();
    if (blocked) {
      if (full) setError('사진은 최대 5장까지 올릴 수 있습니다.');
      return;
    }
    addFiles(event.dataTransfer?.files);
  }

  async function removeAt(index) {
    if (locked) return;
    const target = photos[index];
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
    if (target?.photoId && target.temporary) {
      try {
        await deleteTempPhoto(target.photoId);
      } catch {
        // 제출 시 서버가 사진 목록을 다시 맞춥니다.
      }
    }
  }

  function move(index, delta) {
    if (locked) return;
    const next = [...photos];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function setCover(index) {
    onChange(photos.map((photo, i) => ({ ...photo, cover: i === index })));
  }

  return (
    <div className={clsx(styles.root, variant === 'form' && styles.form)}>
      {variant !== 'form' ? <p>{uiText("장소를 확인할 수 있는 현장 사진을 올려 주세요. 사람 얼굴이나 신분증은 필요하지 않습니다. 제출하면 AI가 사진으로 장소를 확인합니다.")}</p> : null}
      {locked ? (
        <p role='status'>{uiText("확인된 인증 사진은 근거 보존을 위해 바꿀 수 없습니다.")}</p>
      ) : (
        <div>
          <label
            htmlFor={inputId}
            className={clsx(styles.dropzone, dragging && styles.dragging, blocked && styles.disabled)}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-disabled={blocked}
          >
            <input
              id={inputId}
              ref={inputRef}
              className={styles.fileInput}
              type='file'
              accept={ACCEPT_ATTR}
              multiple
              disabled={blocked}
              aria-label={uiText('현장 사진 등록')}
              onChange={(e) => addFiles(e.target.files)}
            />
            <Upload size={22} aria-hidden />
            <span className={styles.dropTitle}>
              {uiText(uploading
                ? '사진을 올리고 있습니다.'
                : full
                  ? '사진을 5장까지 올렸습니다.'
                  : dragging
                    ? '여기에 사진을 놓아 주세요.'
                    : '사진을 끌어다 놓거나 클릭해서 선택하세요.')}
            </span>
            <span className={styles.dropHint}>{uiText("JPEG, PNG, WebP · 장당 5MB 이하 ·")}{uiText(remaining)}{uiText("장 더 올릴 수 있습니다.")}</span>
            {variant === 'form' ? <span className={styles.selectFile}>{uiText('파일 선택')}</span> : null}
          </label>
          {uploading ? <p role='status'>{uiText("사진을 올리고 있습니다.")}</p> : null}
        </div>
      )}
      {error ? <p className={styles.error} role='alert'>{uiText(error)}</p> : null}
      <ul className={styles.list}>
        {photos.map((photo, index) => {
          const src = resolveAssetUrl(photo.thumbUrl || photo.imageUrl || '');
          const isCover = photo.cover || index === 0;
          return (
            <li key={photo.photoId || index}>
              {src ? (
                <img src={src} alt={uiText(photo.altText || `인증 사진 ${index + 1}`)} />
              ) : (
                <span>{uiText("미리보기")}</span>
              )}
              <div className={styles.tools}>
                <span>{uiText(isCover ? '대표 사진' : `${index + 1}번째`)}</span>
                {!locked ? (
                  <>
                    <button type='button' onClick={() => setCover(index)}>{uiText("대표로")}</button>
                    <button type='button' onClick={() => move(index, -1)} disabled={index === 0}>{uiText("앞으로")}</button>
                    <button
                      type='button'
                      onClick={() => move(index, 1)}
                      disabled={index === photos.length - 1}
                    >{uiText("뒤로")}</button>
                    <button type='button' data-intent='danger' onClick={() => removeAt(index)}>{uiText("삭제")}</button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
