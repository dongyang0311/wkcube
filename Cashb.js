// B 版 额度分期
import React, { Component } from 'react'
import Swiper from 'swiper'
import 'swiper/dist/css/swiper.min.css'
import { connect } from 'react-redux'
import { updateUserInfo, updateOneCardInfo, updateBorrowing, updateLoading } from 'actions/'
import { updateToastMessage } from 'fetchActions/updateToastMessage'
import { isBlank } from 'lib/until'
import fetch from 'lib/http'
import session_storage from 'lib/session_storage'
import { fechUserPhoto } from 'fetchActions/fechUserPhoto'

// action映射
const mapDispatchToProps = dispatch => {
  return {
    actions: {
      updateUserInfo: (params) => dispatch(updateUserInfo(params)),
      updateToastMessage: (params) => dispatch(updateToastMessage(params)),
      updateOneCardInfo: (params) => dispatch(updateOneCardInfo(params)),
      updateBorrowing: (params) => dispatch(updateBorrowing(params)),
      updateLoading: (flag) => dispatch(updateLoading(flag)),
      fechUserPhoto: (params) => dispatch(fechUserPhoto(params))
    }
  }
}

// 将state绑定到props的state
const mapStateToProps = state => {
  return {
    state: {
      api: state.api,
      userInfo: state.userInfo,
      config: state.config,
      borrowing: state.borrowing,
      oneCardInfo: state.oneCardInfo
    }
  }
}
@connect(mapStateToProps, mapDispatchToProps)
export default class CashB extends Component {
  constructor (props) {
    super(props)
    let { borrowing } = this.props.state
    this.state = {
      countNum: 0,  // 轮询额度接口次数
      btnDisabled: true, // input 现金输入
      loanAmt: '', // 可借款的总额度
      leastAmt: '', // 最低额度
      todayLoanAmt: '', // 当日最大借款金额
      amount: parseInt(borrowing.amount) || '', // 借款金额
      periods: {}, // 期限
      choicePeriods: borrowing.period || '3', // 选择的期限
      periodText: borrowing.periodText || '--', // 借款期限默认显示文案
      repayM: borrowing.repayM || '0.00', // 每月还款金额
      amtmessageflag: false, // 金额不符信息是否显示，默认不显示
      amtmessage: '', // 金额不符信息
      percent: 0, // 评估中的 数字 %
      assesstxtFlag: true, // 是否显示 ‘评估中 数字 %’
      assessnumberFlag: false, // 是否显示 评估后 ¥金额
      animationFlag: false, // 动画false 不执行 true 执行
      initialSlide: 0, // 默认选中的期限
      nextbtnflag: false, // 下一步按钮是否可用，默认不可用
      newflag: true, // 默认是开的
      checkUserFirst: !isBlank(session_storage.getItem('saveTime'))
    }
  }
  componentWillMount () {
    if (session_storage.getItem('download') == '1') {
      window.location.href = window.location.origin + window.location.pathname + '#/register?proId=' + session_storage.getItem('proId')
    }
    let { api } = this.props.state
    let { updateToastMessage, updateLoading, updateBorrowing, fechUserPhoto } = this.props.actions
    updateBorrowing({repayM: '0.00'})
    fechUserPhoto().then(() => {
      let { baseInfo } = this.props.state.userInfo
      if ((isBlank(baseInfo.idCardPhotos) || baseInfo.idCardPhotos.length != 3)) {
        updateToastMessage({message: '您需要上传照片'})
        window.history.go(-1)
      } else {
        fetch({
          url: api.LOAN_QUOTA // 用户借款接口
        }).then((resposne) => {
          if (resposne.status == '1') {
            this.setState({
              periods: resposne.data.periods, // 期限
              bankCardName: resposne.data.bankCardName,
              bankCardNo: resposne.data.bankCardNo
            })
            session_storage.setItem('productId', resposne.data.productId)
            updateBorrowing({bankName: resposne.data.bankCardName, cardNo: resposne.data.bankCardNo})
            // 判断默认期限
            let { periods } = this.state
            // if (!borrowing.period) {
            Object.keys(periods).map((item, key) => {
              if (key == '0' || item == '12') {
                this.setState({initialSlide: key, choicePeriods: item}) // 存默认的12个月this.setState({choicePeriods: item})
                updateBorrowing({ initialSlide: key, period: item, periodText: item + '个月' }) // period
              }
            })
          } else {
            updateToastMessage({message: resposne.message})
          }
        }).then(() => {
          let { amount, choicePeriods } = this.state
          if (amount) {
            this.getplanRange(choicePeriods)
          }
        }).then(() => {
          let mySwiper = {}
          let _this = this
          let { updateBorrowing } = this.props.actions
          let { initialSlide } = this.state
          mySwiper = new Swiper('.swiper-container', { // '.swiper-container'
            pagination: '.swiper-pagination',
            slidesPerView: 'auto',
            centeredSlides: true,
            paginationClickable: true,
            spaceBetween: 20,
            initialSlide: initialSlide
          })
          $(".swiper-container").on('touchend', () => {
            let { periods } = _this.state
            Object.keys(periods).map((item, key) => {
              if (key == mySwiper.activeIndex) this.setState({choicePeriods: item})
            })
            updateBorrowing({ initialSlide: mySwiper.activeIndex, period: this.state.choicePeriods, periodText: this.state.choicePeriods + '个月' })
            _this.choicePeriod(this.state.choicePeriods)
          })
        }).then(() => {
          updateLoading(false)
        })
      }
    })
  }
  // 输入借款金额
  handleChange (f, e) {
    this.setState({amount: e.target.value})
   // this.checkAmount('input') // 输入校验
    let {loanAmt, leastAmt, todayLoanAmt} = this.state
    let { updateBorrowing } = this.props.actions
    let re = /^[0-9]*[0-9]$/i  // 校验是否为数字
    if (e.target.value == '' || e.target.value == 0) {
      this.setState({amtmessageflag: true, amtmessage: '请输入借款金额', nextbtnflag: false, repayM: '0.00', newflag: false, amount: ''})
      updateBorrowing({'amount': '', repayM: '0.00'})
      return false
    } else if (!re.test(e.target.value)) {
      this.setState({amtmessageflag: true, amtmessage: '您输入的额度不能为汉字或字母等非法符号', nextbtnflag: false, repayM: '0.00', amount: '', newflag: false})
      updateBorrowing({'amount': '', repayM: '0.00'})
      return false
    } else if (e.target.value < leastAmt) {
      this.setState({amtmessageflag: true, amtmessage: '请不要少于'+leastAmt+'元', nextbtnflag: false, repayM: '0.00', newflag: false})
      updateBorrowing({'amount': '', repayM: '0.00'})
      return false
    } else if (e.target.value%100 !== 0) { // 不是100的倍数
      this.setState({amtmessageflag: true, amtmessage: '请输入100的整数倍', nextbtnflag: false, repayM: '0.00', newflag: false})
      updateBorrowing({'amount': '', repayM: '0.00'})
      return false
    } else if (e.target.value > loanAmt) {
      this.setState({amtmessageflag: true, amtmessage: '最多只能借¥'+loanAmt, nextbtnflag: false, repayM: '0.00', newflag: false})
      updateBorrowing({'amount': '', repayM: '0.00'})
      return false
    } else if (e.target.value > todayLoanAmt) {
      this.setState({repayM: '0.00', newflag: false, amtmessageflag: true, amtmessage: '本次最多可提现¥'+todayLoanAmt, nextbtnflag: false})
      updateBorrowing({'amount': '', repayM: '0.00'})
      return false
    } else { // 还需要排查前几位为0 的数字！！！
      this.setState({amount: e.target.value, amtmessageflag: true, amtmessage: '', newflag: true})
      updateBorrowing({'amount': e.target.value}) // 把借款金额存储到redux里面
      if (window.timeout) {
        clearTimeout(window.timeout)
      }
      window.timeout = setTimeout(() => {
        this.getplanRange(this.state.choicePeriods)
      }, 300)
    }
  }
  // 组件被销毁的时候调用
  componentWillUnmount () {
    window.clearInterval(this.state.intervalId)
    window.clearInterval(this.state.intervalId2)
    this.setState({
      intervalId: null,
      intervalId2: null
    })
  }
  componentDidMount () {
    this.progressbar() // 进度条执行
    this.cycGetloan()// 循环调取额度
  }

  // 进度条执行动画 21+39s = 60s
  progressbar () {
    let saveTime = session_storage.getItem('saveTime') //
    // window.alert(!isBlank(saveTime))
    if (!isBlank(saveTime)) { // 如果第一次执行 存在saveTime 为true
      // 新用户执行动画
      this.setState({animationFlag: true})
      // 评估百分比开始
      let percent = 0
      let timer = null
      let timers = null
      timer = setInterval(() => {
        if (percent < 80) { // 前21s
          percent++
          this.setState({percent: percent})
        } else { // 后39s
          clearInterval(timer)
          $(".blue-animation").addClass("adds-animation") // 39s 执行动画
          this.setState({btnDisabled: true})
          // 评估百分比开始39s
          let percent = 80
          timers = setInterval(() => {
            if (percent < 100) { // 当times大于0的时候
              percent++
              this.setState({percent: percent})
            } else {
              clearInterval(timers)
              session_storage.removeItem('saveTime')
            }
          }, 1950)
        }
      }, 262)
      this.setState({
        intervalId: timer,
        intervalId2: timers
      })
      console.log('动画执行完了吗？')
      // this.isBindCard()
    } else {
      this.setState({animationFlag: false})
    }
  }
  loopMethod () {
    // 第一次是12s 之后 第一次调用 然后每3s 调用一次 调用7次 之后 27s 调用最后一次 如果额度为0 或 拒绝 就***
    this.setState({
      countNum: ++this.state.countNum
    })
    this.getLoanAmounts().then((flag) => {
      // //
      // 如果返回的false则会循环调用
      if (!flag) {
        if (this.state.countNum > 7) {
          this.setState({
            countNum: ++this.state.countNum
          })
          setTimeout(() => {
            this.getLoanAmounts()
          }, 27000)
        } else {
          setTimeout(() => {
            this.loopMethod()
          }, 3000)
        }
      } else {
        // 清除进度条
        this.setState({animationFlag: false, btnDisabled: false})
        this.refs.blueAnimation.style.width = "95%"
        window.clearInterval(this.state.intervalId)
        window.clearInterval(this.state.intervalId2)
        this.setState({
          intervalId: null,
          intervalId2: null
        })
        // $("#borrowMoney").removeAttr("disabled")
        session_storage.removeItem('saveTime')
      }
    }).catch((err) => {
      console.log(err)
    })
  }
  // 循环 调取额度接口
  cycGetloan () {
    if (this.state.checkUserFirst) { // 如果第一次执行
      setTimeout(() => {
        this.loopMethod()
      }, 12000)
    } else {
      this.loopMethod()
    }
  }
  // 检查是否跳转到***页面
  checkTriggerUrl ({bangshengResult = '', loanAmt}) {
    let ddcubeUrl = process.env.DDCUBEJDJ
    let ddappUrl = process.env.DDAPP
    console.log(this.state.countNum)
    if (this.state.checkUserFirst) {
      if ((loanAmt == 0 && bangshengResult =='REFUSE') || (loanAmt == 0 && this.state.countNum >= 9) || (bangshengResult =='REFUSE')) { // 当额度为0的时候重新调取接口
        //
        session_storage.removeItem("saveTime")
        if (session_storage.getItem('project') && session_storage.getItem('project') == 'ddapp') { //回跳地址
          window.location.href = ddappUrl
          return false
        } else if (session_storage.getItem('project') && session_storage.getItem('project') == 'ddcube' && session_storage.getItem('cubeToken')) { // 回跳地址
          window.location.href = ddcubeUrl+"token="+session_storage.getItem('cubeToken')
          return false
        } else {
          this.props.router.push('/Wkpreference')
        }
        throw new Error('中断promise')
      }
    } else { // 第二次以及以后
      if (loanAmt == 0 || (bangshengResult =='REFUSE')) { // 当额度为0的时候重新调取接口
        session_storage.removeItem("saveTime")
        if (session_storage.getItem('project') && session_storage.getItem('project') == 'ddapp') {
          window.location.href = ddappUrl
          return false
        } else if (session_storage.getItem('project') && session_storage.getItem('project') == 'ddcube' && session_storage.getItem('cubeToken')) {
          window.location.href = ddcubeUrl+"token="+session_storage.getItem('cubeToken')
          return false
        } else {
          this.props.router.push('/Wkpreference')
        }
        throw new Error('中断promise')
      }
    }
  }
  // 调取额度接口
  getLoanAmounts () {
    let { api } = this.props.state
    let { updateOneCardInfo } = this.props.actions
    return fetch({
      url: api.OPEN_CARD,
      data: {
        channel: 'Y2FzaA=='
      }
    }).then((resposne) => {
      // console.log(resposne)
      let { loanAmt, bangshengResult } = resposne.data
      if (resposne.status == '1') {
        if (loanAmt == 0 || (bangshengResult && bangshengResult == 'REFUSE')) {
          this.checkTriggerUrl(resposne.data)
          return false
        } else {
          this.setState({
            loanAmt: parseInt(resposne.data.loanAmt),
            leastAmt: resposne.data.leastAmt,
            todayLoanAmt: resposne.data.todayLoanAmt,
            assesstxtFlag: false,
            assessnumberFlag: true,
            whoisbig: parseInt(resposne.data.loanAmt) > resposne.data.todayLoanAmt // 可借额度大于
          })
          updateOneCardInfo(resposne.data) // 把额度接口返回的值存储到oneCardInfo.data.js里面
          $("#borrowMoney").removeAttr("disabled")
          return true
        }
      } else if (resposne.status == '1008') {
        // updateLoading(false)
        return false
      } else {
        return false
      }
    })
  }
  // 检查数字是否合法
  checkAmount (e) {
    let { loanAmt, leastAmt, amount, todayLoanAmt } = this.state
    let { updateToastMessage, updateBorrowing } = this.props.actions
    let re = /^[0-9]*[0-9]$/i  // 校验是否为数字
    if (amount == '' || amount == 0) {
      if (e == 'input') {
        this.setState({amtmessageflag: true, amtmessage: '请输入借款金额'})
      } else if (e == 'plan' || 'time' || 'next') {
        updateToastMessage({message: '请输入借款金额'})
      }
      return false
    } else if (!re.test(amount)) {
      if (e == 'input') {
        this.setState({amtmessageflag: true, amtmessage: '您输入的额度不能为汉字或字母等非法符号'})
      } else if (e == 'plan' || 'time' || 'next') {
        updateToastMessage({message: '您输入的额度不能为汉字或字母等非法符号'})
      }
      // updateToastMessage({message: '您输入的额度不能为汉字或字母等非法符号'})
      this.setState({amount: ''})
      return false
    } else if (amount < leastAmt) {
      updateToastMessage({message: '请不要少于¥'+leastAmt})
      this.setState({amount: ''})
      return false
    } else if (amount%100 !== 0) { // 不是100的倍数
      updateToastMessage({message: '请输入100的整数倍'})
      this.setState({amount: ''})
      return false
    } else if (amount > loanAmt) {
      updateToastMessage({message: '最多只能借¥'+loanAmt})
      this.setState({amount: ''})
      return false
    } else if (amount > todayLoanAmt) {
      updateToastMessage({message: '本次最多可提现¥'+todayLoanAmt})
      this.setState({amount: '', repayM: '0.00'})
      return false
    }
    // this.setState({isLock: true})
    updateBorrowing({'amount': amount}) // 把借款金额存储到redux里面
    return true
  }
  // 获得焦点 input 清空
  clearPeriod (e) {
    this.setState({
      amtmessageflag: false,
      amtmessage: ''
    })
  }
  // 选择还款期限
  choicePeriod (key) {
    let { loanAmt, leastAmt, amount, todayLoanAmt } = this.state
    let { updateToastMessage, updateBorrowing } = this.props.actions
    let re = /^[0-9]*[0-9]$/i  // 校验是否为数字
    if (!amount) {
      updateToastMessage({message: '请输入借款金额'})
      this.setState({repayM: '0.00'})
      updateBorrowing({'repayM': '0.00'})
      return false
    } else if (!re.test(amount)) {
      updateToastMessage({message: '您输入的额度不能为汉字或字母等非法符号'})
      this.setState({amount: ''})
      return false
    } else if (amount < leastAmt) {
      updateToastMessage({message: '请不要少于¥'+leastAmt})
      this.setState({amount: ''})
      return false
    } else if (amount > loanAmt) {
      updateToastMessage({message: '最多只能借¥'+loanAmt})
      this.setState({amount: '', repayM: '0.00'})
      updateBorrowing({'repayM': '0.00'})
      return false
    } else if (amount > todayLoanAmt) {
      updateToastMessage({message: '本次最多可提现¥'+todayLoanAmt})
      this.setState({amount: '', repayM: '0.00'})
      updateBorrowing({'repayM': '0.00'})
      return false
    } else if (amount%100 !== 0) { // 不是100的倍数
      updateToastMessage({message: '请输入100的整数倍'})
      this.setState({amount: ''})
      return false
    }
    updateBorrowing({'amount': amount, period: key, periodText: key + '个月'}) // 把借款金额存储到redux里面
    this.setState({choicePeriods: key, periodText: key + '个月'})
    this.getplanRange(key)
  }
  // 获取每月还款金额
  getplanRange (key) {
    let { amount, newflag } = this.state
    let { api } = this.props.state
    let { updateToastMessage, updateBorrowing } = this.props.actions
    // updateLoading(true) // 显示遮罩层
    fetch({
      url: api.LOANORDER_PLAN_RANGE,
      data: {
        period: key, // 借期
        amtTotal: amount, // 借款总额
        productId: '' // 产品编码
      }
    }).then((resposne) => {
    //   updateLoading(false) // 隐藏遮罩层
      if (resposne.status == '1') {
        let amt = resposne.data.length == 0 ? "" : resposne.data[0].amt
        // console.log("["+newflag)
        if (newflag) {
          this.setState({repayM: amt, nextbtnflag: true})
          updateBorrowing({repayM: amt})
          // 点亮
        }
        return true
      } else {
        updateToastMessage({message: resposne.message})
        return false
      }
    })
  }
  // 跳转到查看还款计划页面
  goRepayPlan () {
    let { amount, choicePeriods, todayLoanAmt } = this.state
    let { updateToastMessage } = this.props.actions
    let { loanAmt, leastAmt } = this.state
    let { updateBorrowing } = this.props.actions
    let re = /^[0-9]*[0-9]$/i  // 校验是否为数字
    if (amount == '' || amount == 0) {
      updateToastMessage({message: '请输入借款金额'})
      this.setState({repayM: '0.00'})
      return false
    } else if (!re.test(amount)) {
      updateToastMessage({message: '您输入的额度不能为汉字或字母等非法符号'})
      this.setState({amount: '', repayM: '0.00'})
      return false
    } else if (amount < leastAmt) {
      updateToastMessage({message: '请不要少于¥'+leastAmt})
      this.setState({amount: '', repayM: '0.00'})
      return false
    } else if (amount > loanAmt) {
      updateToastMessage({message: '最多只能借¥'+loanAmt})
      this.setState({amount: '', repayM: '0.00'})
      return false
    } else if (amount > todayLoanAmt) {
      updateToastMessage({message: '本次最多可提现¥'+todayLoanAmt})
      this.setState({amount: '', repayM: '0.00'})
      return false
    } else if (amount%100 !== 0) { // 不是100的倍数
      updateToastMessage({message: '请输入100的整数倍'})
      this.setState({amount: '', repayM: '0.00'})
      return false
    } else if (!choicePeriods) {
      updateToastMessage({message: '请选择借款期限', repayM: '0.00'})
      return false
    }
    updateBorrowing({'amount': amount}) // 把借款金额存储到redux里面
    this.props.router.push('/repayPlan')
  }
  // 跳转确认页
  goDetail () {
    let { updateBorrowing } = this.props.actions
    if (this.checkAmount()) {
      if (this.state.nextbtnflag) {
        if (!this.state.choicePeriods) {
          updateToastMessage({message: '请选择借款期限'})
          return false
        } else {
          updateBorrowing({period: this.state.choicePeriods})
          this.props.router.push('/cashDetailB')
        }
      }
    }
  }
  historyBack () {
    window.history.back()
  }
  render () {
    const { loanAmt, repayM, percent, amtmessageflag, amtmessage, periods, nextbtnflag, newflag } = this.state
    return (
      <section className="loanIndex cashLoanIndex">
        <header onClick={this.historyBack.bind(this)}>额度分期</header>
        <content>
          <div>
            <span>¥</span>
            <div>
              <input id='borrowMoney' disabled={this.state.btnDisabled} value={this.state.amount} onFocus={this.clearPeriod.bind(this)} onChange={this.handleChange.bind(this, 'input')} type="tel" placeholder="请输入借款金额"/>
            </div>
            <span className="repay" id="repayM" onClick={this.goRepayPlan.bind(this)}>每月应还<em>¥{repayM}</em></span>
          </div>
          <div>
            <span className={ amtmessageflag ? '' : "hidden"}>{amtmessage}</span>
            <span id="maxTotal">可用额度&nbsp;<em className={this.state.assessnumberFlag ? '':'hidden'}>¥{loanAmt}</em><span className={this.state.assesstxtFlag ? '':'hidden'}>评估中<em>{percent}%</em></span></span></div>
        </content>
        <div className={this.state.animationFlag ? 'blue-animation add-animation' : 'blue-animation'} ref="blueAnimation"></div>
        <p className="loanp">借款期限</p>
        <div className="loanAmtTime">
          <div></div>
          <div id='btn1'>
            <div className="swiper-container" data-flex-box="1">
                <div className="swiper-wrapper">
                  {
                    Object.keys(periods).map((name, index) => {
                      return <div key={index} data-val={periods[name]} className="swiper-slide">{name}个月</div>
                    })
                  }
                </div>
            </div>
          </div>
        </div>
        <div><button className={ nextbtnflag&&newflag ? "normBtn cashloanB":"normBtn cashloanB bggrey"} onClick={this.goDetail.bind(this)}>下一步</button></div>
      </section>
    )
  }
}
