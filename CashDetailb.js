// B 版 额度分期
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { updateUserInfo, updateLoading, updateBorrowing } from 'actions/'
import { updateToastMessage } from 'fetchActions/updateToastMessage'
import fetch from 'lib/http'
import Base64 from 'lib/base64'
import session_storage from 'lib/session_storage'
import { maxentEvent } from 'lib/maxentPlugin'
import { is_weixn } from 'lib/until'
// action映射
const mapDispatchToProps = dispatch => {
  return {
    actions: {
      updateUserInfo: (params) => dispatch(updateUserInfo(params)),
      updateToastMessage: (params) => dispatch(updateToastMessage(params)),
      updateLoading: (flag) => dispatch(updateLoading(flag)),
      updateBorrowing: (params) => dispatch(updateBorrowing(params))
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
      borrowing: state.borrowing
    }
  }
}
@connect(mapStateToProps, mapDispatchToProps)
export default class CashDetailB extends Component {
  constructor (props) {
    super(props)
    let { borrowing } = this.props.state
    this.state = {
      amount: parseInt(borrowing.amount) || '0.00', // 借款金额
      repayM: borrowing.repayM || '0.00', // 每月还款金额
      choicePeriods: borrowing.period || '--', // 选择的期限
      calcLoanFee: {}, // 费用详情信息
      detailFlag: false, // 详细信息的显示与隐藏
      contractFlag: true, // 合同金额
      expansionDetailFlag: true, // 相关服务费
      bzjhzkFlag: borrowing.period > 12, // 保障计划专款false隐藏 小于等于12期
      checkAgreement: false, // 同意协议
      bzjh_checkAgreement: false, // 保障计划专款协议 同意与否
      count: 0,
      min: 0,
      bankCardName: borrowing.bankName || '--', // 收款银行卡银行名
      bankCardNo: borrowing.cardNo || '--', // 收款银行卡账号
      payCodeFlag: false, // 输入交易密码的弹出框
      payCodeArr: [], // 交易密码的数组
      input1: '',
      input2: '',
      input3: '',
      input4: '',
      input5: '',
      input6: '',
      forgetPswdFlag: false // 忘记密码弹出框提示
    }
  }
  componentWillMount () {
    let { updateToastMessage, updateLoading, updateBorrowing } = this.props.actions
    let { api, borrowing } = this.props.state
    fetch({
      url: api.QUERY_RESULT
    }).then(grayRes => {
      if (grayRes.status == '1') {
        if (grayRes.data.gray == 'F') {
          window.location.href = '' // 跳转到系统维护页面
          return false
        } else {
          fetch({
            url: api.CALC_LOAN_FEE,
            data: {
              period: borrowing.period || session_storage.getItem('period'), // 借款期限
              amtTotal: borrowing.amount || session_storage.getItem('amount') // 借款金额
            }
          }).then(resposne => {
            updateLoading(false)
            if (resposne.status == '1') {
              session_storage.setItem('period', borrowing.period)
              this.setState({ calcLoanFee: resposne.data }) // 费用详情
              updateBorrowing({ calcLoanFee: resposne.data.contractAmt })
              if (this.state.bzjhzkFlag) {
                this.setState({three: (this.state.calcLoanFee.B6636*1+this.state.calcLoanFee.B6648*1+this.state.calcLoanFee.B6647*1).toFixed(2)})
              } else {
                this.setState({three: (this.state.calcLoanFee.B6635*1+this.state.calcLoanFee.B6648*1+this.state.calcLoanFee.B6647*1).toFixed(2)})
              }
            } else {
              updateToastMessage({ message: resposne.message })
            }
          })
        }
      } else {
        updateLoading(false)
        updateToastMessage({
          message: grayRes.message
        })
      }
    })
  }
  componentDidMount () {
    let { borrowing } = this.props.state
    this.setState({checkAgreement: borrowing.financing_submint})
  }
  // 合同金额详细内容
  contractflag () {
    this.setState({contractFlag: !this.state.contractFlag})
  }
  // 相关服务费
  expansionDetailFlag () {
    this.setState({expansionDetailFlag: !this.state.expansionDetailFlag})
  }
  // 保障计划专款 同意与否
  bzjh_checkAgreement () {
    this.setState({bzjh_checkAgreement: !this.state.bzjh_checkAgreement})
  }
  // 查看融资文件列表页
  checkFinancinglist () {
    this.props.router.push('/financingList')
  }
  /* 支付密码部分
    1.显示虚拟键盘payCodeShow()
    2.输入数字addarr()
    3.调取支付密码接口surePayCode()
    4.确认付款sureBorrow (e)
  */
  // 调取支付密码接口
  surePayCode () {
    let { api } = this.props.state
    let { payCodeArr } = this.state
    let { updateToastMessage, updateLoading } = this.props.actions
    updateLoading(true)
    fetch({
      url: api.ONECARD_VERIFYPWD,
      data: {
        tradePwd: Base64.encode(payCodeArr.join('')),
        type: '3'
      }
    }).then((res) => {
      // updateLoading(false)
      if (res.status == '1') { // 验证码校验成功
        this.setState({payCodeFlag: false, count: 0, payCodeArr: [], input1: '', input2: '', input3: '', input4: '', input5: '', input6: ''})
        this.sureBorrow()
      } else { // 失败的问题
        updateLoading(false)
        this.setState({payCodeFlag: false, count: 0, payCodeArr: [], input1: '', input2: '', input3: '', input4: '', input5: '', input6: ''})
        updateToastMessage({message: res.message})
      }
    })
  }
  // 隐藏支付密码弹出框
  kb_hid () {
    this.setState({payCodeFlag: false, count: 0, payCodeArr: [], input1: '', input2: '', input3: '', input4: '', input5: '', input6: ''})
  }
  // 输入字符
  addarr (idx, e) {
    let { payCodeArr } = this.state
    this.state.count++
    if (this.state.count < 6) {
      payCodeArr.push(idx)
      payCodeArr.map((item, key) => {
        if (key == 0) this.setState({input1: item})
        if (key == 1) this.setState({input2: item})
        if (key == 2) this.setState({input3: item})
        if (key == 3) this.setState({input4: item})
        if (key == 4) this.setState({input5: item})
      })
    } else if (this.state.count == 6) {
      payCodeArr.push(idx)
      this.setState({input6: idx})
      // 调取支付密码接口
      this.surePayCode()
    }
  }
  // 清空
  clr () {
    this.setState({count: 0, payCodeArr: [], input1: '', input2: '', input3: '', input4: '', input5: '', input6: ''})
  }
  // 删除某一项
  clearOne () {
    // let { payCodeArr } = this.state
    this.state.count--
    if (this.state.count < 6) {
      this.state.payCodeArr.pop()
      if (this.state.payCodeArr.length == 0) this.setState({input1: ''})
      if (this.state.payCodeArr.length == 1) this.setState({input2: ''})
      if (this.state.payCodeArr.length == 2) this.setState({input3: ''})
      if (this.state.payCodeArr.length == 3) this.setState({input4: ''})
      if (this.state.payCodeArr.length == 4) this.setState({input5: ''})
      if (this.state.payCodeArr.length == 5) this.setState({input6: ''})
    }
  }
  // 显示支付密码的弹出框
  payCodeShow () {
    let { updateToastMessage } = this.props.actions
    let { checkAgreement, bzjh_checkAgreement, bzjhzkFlag } = this.state
    if (bzjhzkFlag == true) { // 专项计划款 如果显示 再继续判断是否选中同意
      if (!bzjh_checkAgreement) {
        updateToastMessage({ message: '请确认并同意《参加保障计划确认书》' })
        return false
      }
    }
    if (!checkAgreement) {
      updateToastMessage({ message: '您需要同意按钮上方的协议' })
      return false
    }
    this.setState({detailFlag: false, payCodeFlag: true})
    $('body').css({
      "position": "fixed",
      "overflow": "hidden"
    })
  }
  // 忘记支付密码
  forgetPassword () {
    this.setState({payCodeFlag: false, forgetPswdFlag: true})
  }
  // 取消忘记支付密码
  cancelForgetPsw () {
    this.setState({count: 0, payCodeArr: [], input1: '', input2: '', input3: '', input4: '', input5: '', input6: ''})
    this.setState({forgetPswdFlag: false})
    $('body').css({
      "position": "static",
      "overflow": "visible"
    })
  }
  // 跳转到下载页面
  goApp () {
    let { config } = this.props.state
    session_storage.setItem('download', '1') // 跳转download页面
    window.location.href = config.downLoadUrl
  }
  // 确认借款
  sureBorrow (e) {
    let { amount, choicePeriods } = this.state
    let { api } = this.props.state
    let { updateToastMessage, updateLoading } = this.props.actions
    // 清除详细信息的显示
    this.setState({detailFlag: false})
    fetch({
      url: api.LOANORDRE_SAVEAMT,
      data: {
        period: choicePeriods, // 借期
        amtTotal: amount, // 借款总额
        productId: '67564FFDADF4AEF8FC4F7807E2C92C9E', // 产品号
        repayType: '1' // 还款方式 等额本息
      }
    }).then((resposne) => {
      if (resposne.status == '1') {
        // 查看详细信息
        this.getAuthInfo()
      } else {
        updateLoading(false)
        updateToastMessage({message: resposne.message})
      }
    })
  }
  /* 支付密码完成后
    1.申请工单后的状态接口
    2.提交工单接口
  */
  // 申请工单后的状态接口
  getAuthInfo () {
    let { api } = this.props.state
    //  let { borrowing } = this.props.state
    let { updateToastMessage, updateLoading } = this.props.actions
    // updateLoading(true)
    fetch({
      url: api.LOANORDRE_AUTHINFO
    }).then(resposne => {
      if (resposne.status == '1') {
        maxentEvent('transaction') // 猛犸设备指纹
        this.saveLoan()
        // this.props.router.push('/loanCheck')
      } else {
        updateLoading(false)
        updateToastMessage({
          message: resposne.message
        })
      }
    })
  }
  // 提交工单接口
  saveLoan () {
    // 先检测灰度
    let { api } = this.props.state
    let {updateToastMessage, updateBorrowing, updateLoading} = this.props.actions
    let { borrowing } = this.props.state
    fetch({
      url: api.H5_LOANORDER_SUBMIT,
      data: {
        period: borrowing.period, // 借期
        amtTotal: parseInt(borrowing.amount), // 借款总额
        productId: borrowing.productId, // 产品号
        repayType: '1', // 还款方式
        textInfo: borrowing.choicePurposes // 借款用途
      }
    }).then(resposne => {
      updateLoading(false)
      if (resposne.status == '1') {
        updateBorrowing({ loanorderDate: resposne.data.loanorderDate, preArrivalDate: resposne.data.preArrivalDate }) // 存储服务器的时间
        session_storage.setItem('loanorderDate', resposne.data.loanorderDate)
        session_storage.setItem('preArrivalDate', resposne.data.preArrivalDate)
        let ddcubelistUrl = process.env.DDCUBELIST
        if (session_storage.getItem('project') && session_storage.getItem('project') == 'ddapp') {
          window.location.href = 'http://w2l/?params={"iosName":"PQRecordViewController","androidName":"com.jfbank.doraemoney.ui.activity.home.MyProgressActivity"}'
        } else if (session_storage.getItem('project') && session_storage.getItem('project') == 'ddcube' && session_storage.getItem('cubeToken')) {
          window.location.href = ddcubelistUrl+"token="+session_storage.getItem('cubeToken')
        } else {
          // 如果是微信浏览器 并且人脸识别没有做
          if (is_weixn()) {
            this.props.router.push('/facetransition') // ***** 人脸识别中转页面 *****
          } else {
            this.props.router.push('/loanStatus') // ***** 跳转到完成页面 *****
          }
        }
      } else if (resposne.status == '2013') {
        updateToastMessage({ message: resposne.message })
        setTimeout(() => {
          this.props.router.push('/upPhoto') // 跳转到上传身份证页面
        }, 2000)
        return false
      } else {
        updateToastMessage({ message: resposne.message })
      }
    })
  }
  historyBack () {
    window.history.back()
  }
  render () {
    const {amount, bankCardName, bankCardNo, choicePeriods, calcLoanFee, contractFlag, repayM, expansionDetailFlag, payCodeFlag, input1, input2, input3, input4, input5, input6, forgetPswdFlag, bzjhzkFlag, three} = this.state
    return (
      <section className="loanIndex cashLoanIndex">
        <header onClick={this.historyBack.bind(this)}>确认借款</header>
        <article>
          <div className='first-div'>
            <div>使用额度</div>
            <div>¥{amount}</div>
            <div></div>
            <div>{bankCardName}&nbsp;{bankCardNo.substr(bankCardNo.length - 4)}</div>
          </div>
          <div className='second-div'>
            <div><p>借款期限</p><p>{choicePeriods + '个月'}</p></div>
            <div><p>合同月利率</p><p>{calcLoanFee.returnRate ? calcLoanFee.returnRate + '%' : '--'}</p></div>
            <div><p>每月应还</p><p>¥{repayM}</p></div>
          </div>
        </article>
        <article>
        <div className='title'>
          <p>费用详情</p>
          <em>费用和利率等级根据风险定价模型综合评估。</em></div>
        <div id="detail_alert">
          <ul className='ul-first'>
            <li>合同金额:<img className="expansion" onClick={this.contractflag.bind(this)} src={require('icon/wk/icon/question.png')} alt="" />
              <span className="numberDetail" id = "contractAmount">
                {calcLoanFee.contractAmt ? ('¥' + calcLoanFee.contractAmt) : ('--')}</span></li>
            <li className={contractFlag ? '':'hidden'}>
              <p className="littlep" >以上借款金额扣除相关协议约定应交付的相关费用后为本次借款实际可用金额。</p>
            </li>
            <li>
              第三方专业服务套餐消费<span className="numberDetail">{three ? ('¥' + three) : ('--')}</span>
            </li>
            <li>
              以下为第三方机构专业的服务套餐，非***平台提供，会员客户选择并认可自愿采购支付以下第三方服务消费。</li>
            <li className={bzjhzkFlag? '':'hidden'}>
              保障计划专款:<span className="numberDetail">{calcLoanFee.B6636 ? '¥' + calcLoanFee.B6636 : '--'}</span>
            </li>
            <li className={(bzjhzkFlag? '':'hidden')?'hidden':(this.state.bzjh_checkAgreement ? 'b_tip_protocol' : 'b_tip_protocol1')} onClick={this.bzjh_checkAgreement.bind(this)}>
              <p>本人自愿消费购买太平财险提供的履约保证保险或向第三方担保机构支付保障计划专款，已知悉上述保险费或保障计划专款非***普惠及其关联方提供借款服务收取的服务费用，同意签署/确认<a className="toFinancing" onClick={this.checkFinancinglist.bind(this)}>《<em >参加保障计划确认书</em>》</a>。</p></li>
            <li className={!bzjhzkFlag? '':'hidden'}>
              保险费:<span className="numberDetail">{calcLoanFee.B6635 ? '¥' + calcLoanFee.B6635 : '--'}</span></li>
            <li>
              贷后服务费:<span className="numberDetail">{calcLoanFee.B6648 ? '¥' + calcLoanFee.B6648 : '--'}</span></li>
            <li>
              仲裁对接技术服务费:<span className="numberDetail">{calcLoanFee.B6647 ? '¥' + calcLoanFee.B6647 : '--'}</span></li>
            <li>平台服务费:
              <img className="expansion" src={require('icon/wk/icon/question.png')} alt="" onClick={this.expansionDetailFlag.bind(this)} />
              <span className="numberDetail">{calcLoanFee.subtotal ? '¥' + calcLoanFee.subtotal : '--'}</span></li>
          </ul>
          <ul className={expansionDetailFlag ? 'ul-first detail_littlep':'ul-first detail_littlep hidden'}>
            <li>撮合服务费
              <span className="numberDetail">{calcLoanFee.B6631 ? '¥' + calcLoanFee.B6631 : '--'}</span></li>
            <li>信用管理评估及技术服务费
              <span className="numberDetail">{calcLoanFee.B6632 ? '¥' + calcLoanFee.B6632 : '--'}</span></li>
            <li>信息技术支持服务费
              <span className="numberDetail">{calcLoanFee.B6603 ? '¥' + calcLoanFee.B6603 : '--'}</span></li>
          </ul>
        </div>
      </article>
      <div onClick={this.checkFinancinglist.bind(this)}>{/* onClick={this.checkAgreement.bind(this)} */}
        <p className={this.state.checkAgreement ? 'b_tip_protocol' : 'b_tip_protocol1'} ><span>我已查看并同意相关协议与费用</span></p>
        <article>
          <p className="littlep">
            1.我已查看并完全同意
            <a className="toFinancing">
              《<em>借款协议</em>》</a>和
              <a className="toFinancing">《<em>信息咨询服务合同</em>》</a>和
              <a className="toFinancing">《<em>信息技术支持服务合同</em>》</a>及相关其他服务消费协议</p>
              <p className="littlep">2.本人自愿消费购买太平财险提供的履约保证保险或向第三方担保机构支付保障计划专款，
                本人知悉上述保险费或保障计划专款以及贷后服务费，仲裁对接技术服务费非***收取的服务费用，
                系第三方服务套餐，本人自愿消费购买此服务！</p>
              <p className="littlep red">以上费用均由借款人自行承担</p>
        </article>
      </div>
      <div>
        <button className={this.state.checkAgreement&&(!this.state.bzjhzkFlag ? 'true': this.state.bzjh_checkAgreement) ? 'cashloanB' : 'cashloanB bbgb'} onClick={this.payCodeShow.bind(this)}>确认借款{amount}元</button></div>
      <p>※******由有限公司运营管理※</p>
      <p>※交易均由***完成※</p>
      {/* 支付密码 －－start */}
      <div className={payCodeFlag ? "layer-cover" : "layer-cover hidden"}>
        <div id="keyBoard">
        <div><img src={require("icon/left.png")} onClick={this.kb_hid.bind(this)}/>输入交易密码</div>
        <table className="zf_tb" id="tb1">
          <tbody>
            <tr>
              <td><input className="zf_in" type="password" maxLength="1" value={input1} id="input1" disabled="disabled"/></td>
              <td><input className="zf_in" type="password" maxLength="1" value={input2} id="input2" disabled="disabled"/></td>
              <td><input className="zf_in" type="password" maxLength="1" value={input3} id="input3" disabled="disabled"/></td>
              <td><input className="zf_in" type="password" maxLength="1" value={input4} id="input4" disabled="disabled"/></td>
              <td><input className="zf_in" type="password" maxLength="1" value={input5} id="input5" disabled="disabled"/></td>
              <td><input className="zf_in last" type="password" maxLength="1" value={input6} id="input6" disabled="disabled"/></td>
            </tr>
          </tbody>
              </table>
              <p><span className="red completion underline" onClick={this.forgetPassword.bind(this)}>忘记密码</span></p>
              <table>
                <tbody>
                  <tr>
                    <td onTouchStart={this.addarr.bind(this, '1')} className="key"><span><em>1</em></span></td>
                    <td onTouchStart={this.addarr.bind(this, '2')} className="key"><span><em>2</em><br/>ABC</span></td>
                    <td onTouchStart={this.addarr.bind(this, '3')} className="key"><span><em>3</em><br/>DEF</span></td>
                  </tr>
                  <tr>
                    <td onTouchStart={this.addarr.bind(this, '4')} className="key"><span><em>4</em><br/>GHI</span></td>
                    <td onTouchStart={this.addarr.bind(this, '5')} className="key"><span><em>5</em><br/>JKL</span></td>
                    <td onTouchStart={this.addarr.bind(this, '6')} className="key"><span><em>6</em><br/>MNO</span></td>
                  </tr>
                  <tr>
                    <td onTouchStart={this.addarr.bind(this, '7')} className="key"><span><em>7</em><br/>PQRS</span></td>
                    <td onTouchStart={this.addarr.bind(this, '8')} className="key"><span><em>8</em><br/>TUV</span></td>
                    <td onTouchStart={this.addarr.bind(this, '9')} className="key"><span><em>9</em><br/>WXYZ</span></td>
                  </tr>
                  <tr>
                    <td onTouchStart={this.clr.bind(this)} className="key" id="space">清空</td>
                    <td onTouchStart={this.addarr.bind(this, '0')} className="key">0</td>
                    <td onTouchStart={this.clearOne.bind(this)} className="key" id="back"><img src={require("icon/cle.png")}/></td>
                  </tr>
                </tbody>
              </table>
            </div>
        </div>
        {/* 支付密码 －－end */}
        {/* 忘记密码 －－start */}
        <div className={forgetPswdFlag ? 'y-popup' : 'y-popup hidden'}>
          <div className="y_opa"></div>
          <div className="y-pop-com yzmCont" id="inputWrap">
            <p className="yp_tit">请下载******APP，以找回密码</p>
            <div className="y_btn_box flex">
              <a className="btncancel cell_1" href="javascript:void(0)" onClick={this.cancelForgetPsw.bind(this)}>取消</a>
              <a className="btnok cell_1" href="javascript:void(0)" onClick={this.goApp.bind(this)}>确认</a>
            </div>
          </div>
        </div>
      </section>
    )
  }
}
