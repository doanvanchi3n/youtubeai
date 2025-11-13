import Panel from '../../components/Panel/Panel.jsx'
import arrowRight from '../../assets/icons/arrow-right.svg'
import robotIcon from '../../assets/icons/robot-excited-outline.svg'
import pictureIcon from '../../assets/icons/picture-one.svg'
import styles from './AISuggestion.module.css'

export default function AISuggestion() {
  return (
    <div className={styles.container}>
      <Panel className={styles.wrapper} />
      <div className={styles.form}>
        <div className={styles.inputWrapper}>
          <div className={styles.iconGroup}>
            <img src={pictureIcon} alt="" className={styles.inputIcon} />
            <img src={robotIcon} alt="" className={`${styles.inputIcon} ${styles.robotIcon}`} />
          </div>
          <input className={styles.input} placeholder="Nhập mô tả" />
          <img src={arrowRight} alt="" className={styles.arrowIcon} />
        </div>
      </div>
    </div>
  )
}
