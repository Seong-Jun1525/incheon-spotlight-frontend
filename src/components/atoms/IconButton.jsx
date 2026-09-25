/**
 * IconButton.jsx — 아이콘만 담는 정사각 버튼 컴포넌트
 * - forwardRef로 버튼 DOM을 넘겨 팝오버 앵커나 포커스 이동에 쓸 수 있게 함
 * - aria-label을 받아 아이콘 버튼의 접근성 이름을 제공
 */
import { forwardRef } from 'react'
import clsx from 'clsx'
import styles from './IconButton.module.scss'

export const IconButton = forwardRef(function IconButton(
  { children, className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(styles.root, className)}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  )
})
