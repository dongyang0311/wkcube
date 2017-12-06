// 开通流程中的绑定信用卡
import React, { Component } from 'react'
import { showToast, showAlert, updateLoading, updateUserStatus, updateDentityInfo } from 'actions/'
import { updateToastMessage } from 'fetchActions/updateToastMessage'
import { fetchUserStatus } from 'fetchActions/fetchUserStatus'
import { connect } from 'react-redux'
import session_storage from 'lib/session_storage'
import fetch from 'lib/http'
// import ProcessHeader from 'components/openProcess/ProcessHeader'
// action映射
const mapDispatchToProps = dispatch => {
  return {
    actions: {
      showToast: (info) => dispatch(showToast(info)),
      showAlert: (info) => dispatch(showAlert(info)),
      updateToastMessage: (params) => dispatch(updateToastMessage(params)),
      updateUserStatus: (params) => dispatch(updateUserStatus(params)),
      fetchUserStatus: (params) => dispatch(fetchUserStatus(params)),
      updateLoading: (flag) => dispatch(updateLoading(flag)),
      updateDentityInfo: (config) => dispatch(updateDentityInfo(config))
    }
  }
}

// 将api绑定到props的api
const mapStateToProps = state => {
  return {
    api: state.api,
    userInfo: state.userInfo,
    dentityInfo: state.dentityInfo
  }
}
@connect(mapStateToProps, mapDispatchToProps)
export default class CompleteInfoWaiting extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: 0, // loading图
      count: 0, // 倒计时百分比 默认0%
      timer: '', // 倒计时 信息滚动速度1
      timer2: '', // 倒计时 信息滚动速度1
      timer3: '', // 倒计时 火箭速度1
      timer4: '', // 倒计时 火箭速度2
      timer5: '', // 倒计时 百分比速度1
      timer6: '', // 倒计时 百分比速度2
      dataImg: "", // 图形验证码
      countFlag: true, // 倒计时弹框是否显示
      adsrc: '',
      loadingtext: ['请求提交中 5%', '系统已接收请求 10%', '正在进行身份验证 15%', '身份验证中 20%', '系统处理数据中 25%', '已通过初步检验 30%', '正在进行对比数据 35%', '对比数据中 40%', '数据对比成功 45%', '通过第二步检验 50%', '初始化额度参数 55%', '初始化环境参数 60%', '初始化用户产生 65%', '初始化信息成功 70%', '正在生成规则核查数据 75%', '正在进行规则核查 80%', '规则数据核查中 85%', '规则第一次核查通过 90%', '正在建立数据通道 95%', '数据开始后台传输 100%']
    }
  }
  componentDidMount () {
    let { updateLoading, updateDentityInfo } = this.props.actions
    updateLoading(false)
    session_storage.removeItem('customerInfo')
    updateDentityInfo({customerInfo: ''})
    this.countDown()
    this.setItemTask()
  }
  componentWillMount () {
    session_storage.removeItem('customerInfo')
    let { updateDentityInfo } = this.props.actions
    updateDentityInfo({customerInfo: ''})
  }
  cleartime (){
    let { timer, timer2, timer3, timer4, timer5, timer6 } = this.state
    clearInterval(timer)
    clearInterval(timer2)
    clearInterval(timer5) // 百分比 速度1
    clearInterval(timer6) // 百分比 速度2
  }
  // 倒计时方法 动画
  countDown () {
    let _this = this
    let { timer, timer2, timer3, timer4, timer5, timer6 } = this.state
    this.setState({countFlag: true, count: 0})
    this.cleartime()
    let pnum = 0
    $('.evaLateLDIconB').removeClass('evaLateLDIconB_w evaLateLDIconB_b')
    $('.evaLateLDTTop').css('top', '0rem') // 每次执行前信息滚动到原始位置
    timer = setInterval(() => {
      $('.evaLateLDTTop').css('top', -(pnum)+'rem')
      if (pnum < 32) {
        pnum+=2
      } else {
        clearInterval(timer)
        let timer2 = setInterval(() => {
          if (pnum < 38) {
            pnum+=2
            $('.evaLateLDTTop').css('top', -(pnum)+'rem')
          } else {
            clearInterval(timer2)
          }
        }, 5000)
      }
    }, 1250)
    timer3 = setTimeout(() => {
      $('.evaLateLDIconB').addClass('evaLateLDIconB_w') // 火箭添加速度
    }, 10)
    timer4 = setTimeout(() => {
      $('.evaLateLDIconB').addClass('evaLateLDIconB_b')
    }, 20000)
    timer5 = setInterval(() => {
      if (_this.state.count ++ < 80) {
        this.setState({count: _this.state.count ++})
      } else {
        clearInterval(timer5)
        timer6 = setInterval(() => {
          if (_this.state.count ++ < 98) {
            this.setState({count: _this.state.count ++})
          } else {
            clearInterval(timer6)
          }
        }, 1000)
      }
    }, 250)
    this.setState({timer: timer, timer2: timer2, timer3: timer3, timer4: timer4, timer5: timer5, timer6: timer6})
  }
  // 接口轮询
  setItemTask () {
    let {api, dentityInfo} = this.props
    let { updateToastMessage } = this.props.actions
    // updateLoading(true)
    let InteClear = setInterval(() => {
      fetch({
        url: api.ONECARD_AUTHINFO // 轮询开卡激活状态状态接口
      }).then((data) => {
        if (data.status == 1) {
          if (data.data.operatorStatus!=2 && data.data.creditStatus != 2) {
            if (session_storage.getItem('skipCredit') == '1') { // 跳过信用卡的只看运营商
              if (data.data.operatorStatus == '1') {  // 运营商已授权1 才能提交
                // 提交信息
                if (data.data.isCustomerInfoExists == '0') { // 没提交个人信息
                  fetch({
                    url: api.H5_CUSTOMER_SUBMIT, // 查询保存的临时借款期限和额度接口
                    data: {
                      industry: dentityInfo.industry || session_storage.getItem('industry'),
                      profession: dentityInfo.profession || session_storage.getItem('profession'),
                      education: dentityInfo.education || session_storage.getItem('education'),
                      marriage: dentityInfo.marriage || session_storage.getItem('education'),
                      province: dentityInfo.province || session_storage.getItem('province'),
                      city: dentityInfo.city || session_storage.getItem('city'),
                      county: dentityInfo.county || session_storage.getItem('county'),
                      address: dentityInfo.address.replace(/\s+/g, "") || session_storage.getItem('address').replace(/\s+/g, ""),
                      email: dentityInfo.email.replace(/\s+/g, "") || session_storage.getItem('email').replace(/\s+/g, ""), // 手动去除空格
                      company: dentityInfo.company.replace(/\s+/g, "") || session_storage.getItem('company').replace(/\s+/g, ""),
                      relativeName: dentityInfo.urgentName.replace(/\s+/g, "") || session_storage.getItem('urgentName').replace(/\s+/g, ""),
                      relativePhone: dentityInfo.urgentMobile.replace(/\s+/g, "") || session_storage.getItem('urgentMobile').replace(/\s+/g, ""),
                      relative: dentityInfo.relative || session_storage.getItem('relative')
                    }
                  }).then((resposne) => {
                    if (resposne.status == '1') {
                      clearInterval(InteClear)
                      this.cleartime()
                      debugger
                      if (session_storage.getItem('userLable') && (session_storage.getItem('project')=='ddcube' || session_storage.getItem('project')=='ddapp')) {
                        let { userInfo, api } = this.props.state
                        fetch({
                          url: api.TODINGDANGZMAANDOPERATOR,
                          data: {
                            mobile: userInfo.baseInfo.mobile || session_storage.getItem('mobile')
                          },
                          type: 'distribute'
                        }).then(() => {
                          window.history.go(-1)
                        })
                      } else {
                        window.history.go(-1)
                      }
                    //  window.sessionStorage.setItem('saveTime', new Date().getTime())
                      window.history.go(-1)
                    } else {
                      updateToastMessage({message: resposne.message})
                    }
                  })
                } else {
                  clearInterval(InteClear)
                  cthis.cleartime()
                  window.history.go(-1)// 跳中转页
                }
              } else { // 运营商未授权 0
                clearInterval(InteClear)
                this.cleartime()
                debugger
              //  window.sessionStorage.setItem('saveTime', new Date().getTime())
                window.history.go(-1)
              }
            } else {
              if (data.data.operatorStatus == 1 && data.data.creditStatus == 1) {  // 运营商和信用卡都是已授权 才能提交
                // 提交信息
                if (data.data.isCustomerInfoExists == '0') { // isCustomerInfoExists == 0
                  fetch({
                    url: api.H5_CUSTOMER_SUBMIT, // 查询保存的临时借款期限和额度接口
                    data: {
                      industry: dentityInfo.industry || session_storage.getItem('industry'),
                      profession: dentityInfo.profession || session_storage.getItem('profession'),
                      education: dentityInfo.education || session_storage.getItem('education'),
                      marriage: dentityInfo.marriage || session_storage.getItem('education'),
                      province: dentityInfo.province || session_storage.getItem('province'),
                      city: dentityInfo.city || session_storage.getItem('city'),
                      county: dentityInfo.county || session_storage.getItem('county'),
                      address: dentityInfo.address.replace(/\s+/g, "") || session_storage.getItem('address').replace(/\s+/g, ""),
                      email: dentityInfo.email.replace(/\s+/g, "") || session_storage.getItem('email').replace(/\s+/g, ""), // 手动去除空格
                      company: dentityInfo.company.replace(/\s+/g, "") || session_storage.getItem('company').replace(/\s+/g, ""),
                      relativeName: dentityInfo.urgentName.replace(/\s+/g, "") || session_storage.getItem('urgentName').replace(/\s+/g, ""),
                      relativePhone: dentityInfo.urgentMobile.replace(/\s+/g, "") || session_storage.getItem('urgentMobile').replace(/\s+/g, ""),
                      relative: dentityInfo.relative || session_storage.getItem('relative')
                    }
                  }).then((resposne) => {
                    if (resposne.status == '1') {
                      clearInterval(InteClear)
                      this.cleartime()
                      if (session_storage.getItem('userLable') && (session_storage.getItem('project')=='ddcube' || session_storage.getItem('project')=='ddapp')) {
                        let { userInfo, api } = this.props.state
                        fetch({
                          url: api.TODINGDANGZMAANDOPERATOR,
                          data: {
                            mobile: userInfo.baseInfo.mobile || session_storage.getItem('mobile')
                          },
                          type: 'distribute'
                        }).then(() => {
                          window.history.go(-1)
                        })
                      } else {
                        window.history.go(-1)
                      }
                    //  window.sessionStorage.setItem('saveTime', new Date().getTime())
                      window.history.go(-1)
                    } else {
                      updateToastMessage({message: resposne.message})
                    }
                  })
                } else {
                  clearInterval(InteClear)
                  this.cleartime()
                  window.history.go(-1)// 跳中转页
                }
              } else { // 运营商或信用卡有一个是未授权的
                this.cleartime()
                clearInterval(InteClear)
                window.history.go(-1)// 跳中转页
              }
            }
          }
        } else if (data.status == 1008) {
          this.cleartime()
          clearInterval(InteClear)
        } else {
          // this.countDown() // 倒计时
            // this.setState({verificationCodeFlag: true})
          updateToastMessage({message: data.message})
        }
      })
    }, 3000)
    this.setState({InteClear: InteClear})
  }
  goback () {
    clearInterval(this.state.InteClear)
    this.cleartime()
    window.history.go(-1)
  }
  render () {
    const {loadingFlag, countFlag, loadingtext, count} = this.state
            //  officeNet, openWebBank} = this.state
    // const { dentityInfo } = this.props
    return (
      <section className="creditcard">
        {/* <ProcessHeader checked={'3'}></ProcessHeader> */}
        <section className={loadingFlag ? '' : 'hidden'}>
          <div className="maskwk"></div>
          <div className="loading"><img src={require("icon/wk/loading1.gif")}/></div>
        </section>

        <div className={countFlag ? 'timeDown' : 'timeDown hidden'}>
          <header onClick={this.goback.bind(this)}>评估额度</header>
          <div className='countDownBox'>
              <div className="evaLateLDText">
                <p className="evaLateLDTTitile">
                  正在评估
                  {/* {{currentTextA}} */}
                </p>
                <div className="evaLateLDTCenter">
                  <div className="evaLateLDTTop">
                    {
                      loadingtext.map((item, key) => {
                        return <p key={key} href="javascript:;">{item}</p>
                      })
                    }
                  </div>
                </div>
                <div className='whiteshade'><div className="evaLateLDTTitile evaLateLDTexta">{count}%</div></div>
              </div>
              <div className="evaLateLDSchedule">
                <div className="evaLateLDIconB">
                  <div className="evaLateLDIcon"></div>
                </div>
              </div>
          </div>
        </div>
    </section>
    )
  }
}
