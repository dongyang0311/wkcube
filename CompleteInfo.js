// 补全信息页面
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { updateLoading, updateBorrowing, updateBaseInfo, updateDentityInfo } from 'actions/'
import { updateToastMessage } from 'fetchActions/updateToastMessage'
// import { isBlank } from 'lib/until'
import session_storage from 'lib/session_storage'
import fetch from 'lib/http'
import { maxentEvent } from 'lib/maxentPlugin'
import ProcessHeader from 'components/openProcess/ProcessHeader'
// import { mobilelastNumber } from 'lib/until'
// action映射
const mapDispatchToProps = dispatch => {
  return {
    actions: {
      updateToastMessage: (params) => dispatch(updateToastMessage(params)),
      updateBorrowing: (params) => dispatch(updateBorrowing(params)),
      updateBaseInfo: (params) => dispatch(updateBaseInfo(params)),
      updateDentityInfo: (config) => dispatch(updateDentityInfo(config)),
      updateLoading: (flag) => dispatch(updateLoading(flag))
    }
  }
}

// 将state绑定到props的state
const mapStateToProps = state => {
  return {
    state: {
      api: state.api,
      borrowing: state.borrowing,
      userInfo: state.userInfo,
      dentityInfo: state.dentityInfo
    }
  }
}
@connect(mapStateToProps, mapDispatchToProps)
export default class CompleteInfo extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectList: [],
      selectHeight: '',
      selectFlag: false,
      industry: '', // 行业
      industryText: '请选择',
      profession: '', // 职业
      professionText: '请选择',
      education: '', // 学历
      educationText: '请选择',
      marriage: '', // 婚姻状况
      marriageText: '请选择',
      province: '', // 省
      city: '', // 市
      county: '', // 区县
      addressText: '请选择',
      address: '', // 详细地址
      relative: '', // 与本人的关系
      relativeTetx: '请选择',
      email: '', // 邮箱
      company: '', // 公司名称
      urgentName: '', // 紧急联系人姓名
      urgentNameFlag: false, // 紧急联系人弹出框
      urgentMobile: '', // 紧急联系人电话
      adsrc: '',
      purposesText: '个人或家庭消费', // 借款用途
      abflag: true // ab 版 借款用途是否显示
    }
  }
  componentWillMount () {
    let { api, dentityInfo } = this.props.state
    let { updateToastMessage, updateLoading, updateBaseInfo, updateDentityInfo } = this.props.actions
    fetch({
      url: api.ONECARD_AUTHINFO // 开卡激活状态状态接口 看用户信息是否全
    }).then((data) => {
      if (data.status == 1) {
        if (data.data.isCustomerInfoExists!=0 && data.data.allExists == 0) { // 有信息但不全
          fetch({
            url: api.CUSTOMER_EXTENDINFO
          }).then((userRes) => {
            if (userRes.status == '1') {
              let d = userRes.data
              if (dentityInfo.industry == '') { // 行业
                updateDentityInfo({industry: d.industry})
                this.setState({industry: d.industry})
                this.initSelect('industry', d.industry, 'industryText')
              } else {
                this.setState({industry: dentityInfo.industry})
                this.initSelect('industry', dentityInfo.industry, 'industryText')
              }
              if (dentityInfo.profession == '') { // 职业
                updateDentityInfo({profession: d.profession})
                this.setState({profession: d.profession})
                this.initSelect('profession', d.profession, 'professionText')
              } else {
                this.setState({profession: dentityInfo.profession})
                this.initSelect('profession', dentityInfo.profession, 'professionText')
              }
              if (dentityInfo.education == '') { // 学历
                updateDentityInfo({education: d.education})
                this.setState({education: d.education})
                this.initSelect('education', d.education, 'educationText')
              } else {
                this.setState({education: dentityInfo.education})
                this.initSelect('education', dentityInfo.education, 'educationText')
              }
              if (dentityInfo.marriage == '') { // 婚姻状况
                updateDentityInfo({marriage: d.marriage})
                this.setState({marriage: d.marriage})
                this.initSelect('marriage', d.marriage, 'marriageText')
              } else {
                this.setState({marriage: dentityInfo.marriage})
                this.initSelect('marriage', dentityInfo.marriage, 'marriageText')
              }
              if (dentityInfo.province == '') { // 省市区县以及显示
                updateDentityInfo({province: d.province, city: d.city, county: d.county, addressText: (d.province + d.city + d.county) || '请选择', address: d.address})
                this.setState({province: d.province, city: d.city, county: d.county, addressText: (d.province + d.city + d.county) || '请选择', address: d.address})
              } else {
                this.setState({province: dentityInfo.province, city: dentityInfo.city, county: dentityInfo.county, addressText: (dentityInfo.province + dentityInfo.city + dentityInfo.county) || '请选择', address: dentityInfo.address})
              }
              if (dentityInfo.address == '') { // 详细地址
                updateDentityInfo({address: d.address})
                this.setState({address: d.address})
              } else {
                this.setState({address: dentityInfo.address})
              }
              if (dentityInfo.company == '') { // 公司
                // console.log(dentityInfo.company)
                updateDentityInfo({company: d.company})
                this.setState({company: d.company})
              } else {
                // console.log(dentityInfo.company)
                this.setState({company: dentityInfo.company})
              }
              if (dentityInfo.email == '') { // 邮箱
                updateDentityInfo({email: d.email})
                this.setState({email: d.email})
              } else {
                this.setState({email: dentityInfo.email})
              }
              if (dentityInfo.urgentMobile == '') { // 紧急联系人电话
                updateDentityInfo({urgentMobile: d.relativePhone})
                this.setState({urgentMobile: d.relativePhone})
              } else {
                this.setState({urgentMobile: dentityInfo.urgentMobile})
              }
              if (dentityInfo.urgentName == '') { // 紧急联系人姓名
                updateDentityInfo({urgentName: d.relativeName})
                this.setState({urgentName: d.relativeName})
              } else {
                // console.log(dentityInfo.urgentName)
                this.setState({urgentName: dentityInfo.urgentName})
              }
              if (dentityInfo.relative == '') {
                updateDentityInfo({relative: d.relative})
                this.setState({relative: d.relative})
                this.initSelect('relative', d.relative, 'relativeTetx')
              } else {
                this.setState({relative: dentityInfo.relative})
                this.initSelect('relative', dentityInfo.relative, 'relativeTetx')
              }
            } else if (userRes.status == '1008') {

            } else {
              updateToastMessage({message: userRes.message})
            }
          }).then(() => {
            fetch({
              url: api.CUSTOMER_INFO
            }).then((resInfo) => {
              if (resInfo.status == '1') {
                updateBaseInfo({
                  name: resInfo.data.name,
                  mobile: resInfo.data.mobile
                })
              } else if (resInfo.status == '1008') {

              } else {
                updateToastMessage({message: resInfo.message})
              }
            }).then(() => {
              updateLoading(false)
            })
          })
        } else { // 信息全的 或者没有信息的
          fetch({
            url: api.CUSTOMER_INFO
          }).then((resInfo) => {
            if (resInfo.status == '1') {
              updateBaseInfo({
                name: resInfo.data.name,
                mobile: resInfo.data.mobile
              })
            } else if (resInfo.status == '1008') {

            } else {
              updateToastMessage({message: resInfo.message})
            }
          }).then(() => {
            if (dentityInfo.industry != '') this.setState({industry: dentityInfo.industry, industryText: dentityInfo.industryText}) // 行业
            if (dentityInfo.profession != '') this.setState({profession: dentityInfo.profession, professionText: dentityInfo.professionText}) // 职业
            if (dentityInfo.education != '') this.setState({education: dentityInfo.education, educationText: dentityInfo.educationText}) // 学历
            if (dentityInfo.marriage != '') this.setState({marriage: dentityInfo.marriage, marriageText: dentityInfo.marriageText}) // 婚姻状况
            if (dentityInfo.province != '') this.setState({province: dentityInfo.province, city: dentityInfo.city, county: dentityInfo.county, addressText: dentityInfo.addressText}) // 省市区县以及显示
            if (dentityInfo.address != '') this.setState({address: dentityInfo.address}) // 具体地址
            if (dentityInfo.email != '') this.setState({email: dentityInfo.email}) // 邮箱
            if (dentityInfo.company != '') this.setState({company: dentityInfo.company}) // 邮箱
            if (dentityInfo.urgentMobile != '') this.setState({urgentMobile: dentityInfo.urgentMobile}) // 紧急联系人电话
            if (dentityInfo.urgentName != '') this.setState({urgentName: dentityInfo.urgentName}) // 紧急联系人姓名
            if (dentityInfo.relative != '') this.setState({relative: dentityInfo.relative, relativeTetx: dentityInfo.relativeTetx}) // 关系
          }).then(() => {
            updateLoading(false)
          })
        }
      }
    })
    fetch({
      url: api.GETADVIERTISEMENT,
      data: {
        adType: 7,
        adUser: 19
      },
      type: 'YX'
    }).then((res) => {
      updateLoading(false)
      if (res.status == '1') {
        if (res.data) {
          this.setState({adsrc: res.data[0].img_url})
        }
      }
    })
  }
  // 已填信息回显
  initSelect (w, v, txt) {
    let { api } = this.props.state
    let { updateToastMessage } = this.props.actions
    fetch({
      url: api.DICDATA_BYTYPE,
      data: {
        type: w
      }
    }).then((wRes) => {
      if (wRes.status == '1') {
        wRes.data[0].childrens.map((item, key) => {
          if (item.value == v) {
            let obj = {}
            obj[txt] = item.name
            this.setState(obj)
          }
        })
      } else if (wRes.status == '1008') {

      } else {
        updateToastMessage({message: wRes.message})
      }
    })
  }
  // 输入文本内容
  onchange (key, e) {
    let { updateDentityInfo } = this.props.actions
    if (key == 'email') {
      this.setState({email: e.target.value})
      updateDentityInfo({email: e.target.value})
    }
    if (key == 'company') {
      this.setState({company: e.target.value})
      updateDentityInfo({company: e.target.value})
    }
    if (key == 'urgentName') {
      this.setState({urgentName: e.target.value})
      updateDentityInfo({urgentName: e.target.value})
    }
    if (key == 'urgentMobile') {
      this.setState({urgentMobile: e.target.value})
      updateDentityInfo({urgentMobile: e.target.value})
    }
    if (key == 'address') {
      this.setState({address: e.target.value})
      updateDentityInfo({address: e.target.value})
    }
  }
  // 弹出下拉列表
  pleaseSelect (key, e) {
    let { api } = this.props.state
    let { updateToastMessage } = this.props.actions
    fetch({
      url: api.DICDATA_BYTYPE,
      data: {
        type: key
      }
    }).then((resposne) => {
      if (resposne.status == '1') {
        this.setState({selectList: resposne.data[0].childrens, selectFlag: true})
        if (resposne.data[0].childrens.length < 5) this.setState({selectHeight: 'periodSel l'})
        if (resposne.data[0].childrens.length > 5 && resposne.data[0].childrens.length < 7) this.setState({selectHeight: 'periodSel m'})
        if (resposne.data[0].childrens.length > 7) this.setState({selectHeight: 'periodSel t'})
        $('body').css('position', 'fixed')
      } else if (resposne.status == '1008') {

      } else {
        updateToastMessage({message: resposne.message})
      }
    })
  }
  // 选择借款用途
  borrowresult (key, e) {
    let { api } = this.props.state
    let { updateToastMessage } = this.props.actions
    fetch({
      url: api.LOAN_QUOTA
    }).then((resposne) => {
      if (resposne.status == '1') {
        this.setState({selectList: resposne.data.purposes, selectFlag: true})
        if (resposne.data.purposes.length < 5) this.setState({selectHeight: 'periodSel l'})
        if (resposne.data.purposes.length > 5 && resposne.data.purposes.length < 7) this.setState({selectHeight: 'periodSel m'})
        if (resposne.data.purposes.length > 7) this.setState({selectHeight: 'periodSel t'})
        $('body').css('position', 'fixed')
      } else if (resposne.status == '1008') {

      } else {
        updateToastMessage({message: resposne.message})
      }
    })
  }
  // 跳转到省市区县列表页面
  goProvnice (e) {
    this.props.router.push('/address')
  }
  // 下拉列表的选择
  selectOne (key, keyParent, keyName, e) {
    let { updateDentityInfo, updateBorrowing } = this.props.actions
    if (keyParent == 'F11') {
      this.setState({purposesText: keyName, purposes: key})
      updateDentityInfo({purposesText: keyName, purposes: key}) // 借款用途
      updateBorrowing({choicePurposesText: keyName, choicePurposes: key}) // 存储到borrowing中
    }
    if (keyParent == 'B10') {
      this.setState({industryText: keyName, industry: key}) // 行业
      updateDentityInfo({industryText: keyName, industry: key})
    }
    if (keyParent == 'F123') {
      this.setState({professionText: keyName, profession: key}) // 职业
      updateDentityInfo({professionText: keyName, profession: key})
    }
    if (keyParent == 'B03') {
      this.setState({educationText: keyName, education: key}) // 学历
      updateDentityInfo({educationText: keyName, education: key})
    }
    if (keyParent == 'B05') {
      this.setState({marriageText: keyName, marriage: key}) // 婚姻状况
      updateDentityInfo({marriageText: keyName, marriage: key})
    }
    if (keyParent == '975c6e48314a006683a7c6419996cdbf') {
      this.setState({relativeTetx: keyName, relative: key}) // 与本人的关系
      updateDentityInfo({relativeTetx: keyName, relative: key})
    }
    $('body').css('position', '')
    this.setState({selectFlag: false, selectHeight: ''})
  }
  // 显示紧急联系人姓名
  showUrgentName (e) {
    this.setState({urgentNameFlag: true})
    $("#urgentName").blur()
  }
  // 确认阅读紧急联系人姓名
  closeUrgentName (e) {
    this.setState({urgentNameFlag: false})
    $("#urgentName").focus()
  }
  // 点击确认
  submit (e) {
    let { userInfo, api } = this.props.state
    let { industry, profession, education, marriage, relative, province,
          city, county, address, email, company, urgentName, urgentMobile } = this.state
    let {updateToastMessage, updateDentityInfo} = this.props.actions
    let email2 = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/
    let vPhonenum= /^(13[0-9]|14[0-9]|15[0-9]|(17[0-9])|18[0-9])\d{8}$/i
    let vCompany=/^[^ ]{4,50}$/
    let teshu=/[🐶🐺🐱🐭🐹🐰🐸🐗🐮🐷🐻🐨🐯🐵🐒🐴🐑🐘🐼🐧🐦🐤🐝🐛🐠🐟🐬🐜🐥🐣🐞🐳🐋🐌🐔🐍🐙🐄🐏🐢🐀🐓🐊🐫🐃🐕🐅🐖🐪🐆🐁🐇🐉🐂🐈🐩🐲🐎🐐🐡,，.。、@a-zA-Z0-9](?!·)/
    let Vname = /^[\u4E00-\u9FA5.]{2,5}(?:·[\u4E00-\u9FA5]{2,5})*/
    let charReg = new RegExp(/\r|\n|\||丨|｜/g) // 校验换行符 |
    let addressReg = new RegExp(/^[\u4e00-\u9fa5\w~':;,.{}【】"‘；：”“，。（）#()、@[\]\-_+*.<>/{｝&]+$/) // 校验中文 字母 数字
    if (industry == '') {
      updateToastMessage({message: '请选择行业'})
      return false
    } else if (profession == '') {
      updateToastMessage({message: '请选择职业'})
      return false
    } else if (education == '') {
      updateToastMessage({message: '请选择学历'})
      return false
    } else if (marriage == '') {
      updateToastMessage({message: '请选择婚姻状况'})
      return false
    } else if (province == '') {
      updateToastMessage({message: '请选择您所在的省'})
      return false
    } else if (city == '') {
      updateToastMessage({message: '请选择您所在的市'})
      return false
    } else if (address == '') {
      updateToastMessage({message: '请选择您所在的详细地址'})
      return false
    } else if (email == '') {
      updateToastMessage({message: '请填写您的邮箱'})
      return false
    } else if (company == '') {
      updateToastMessage({message: '请填写您的公司的名称'})
      return false
    } else if (urgentName == '') {
      updateToastMessage({message: '请填写您紧急联系人的姓名'})
      return false
    } else if (urgentMobile == '') {
      updateToastMessage({message: '请填写您紧急联系人的联系方式'})
      return false
    } else if (relative == '') {
      updateToastMessage({message: '请填写您与紧急联系人的关系'})
      return false
    } else if (urgentName == '') {
      updateToastMessage({message: '请填写您与紧急联系人的关系'})
      return false
    } else if (charReg.test(address) || !addressReg.test(address)) {
      updateToastMessage({message: '存在非法字符，请重新输入'})
      return false
    } else if (!email2.test(email)) {
      updateToastMessage({message: '电子邮箱格式不正确'})
      return false
    } else if (!vCompany.test(company)) {
      updateToastMessage({message: '公司名格式不正确'})
      return false
    } else if (!Vname.test(urgentName.replace(/\s+/g, "")) || urgentName.indexOf(" ")!=-1 || teshu.exec(urgentName) != null) {
      updateToastMessage({message: '紧急人姓名格式不正确'})
      return false
    } else if (urgentName == userInfo.baseInfo.name) {
      updateToastMessage({message: '紧急联系人不能是本人'})
      return false
    } else if (!vPhonenum.test(urgentMobile)) {
      updateToastMessage({message: '紧急联系人电话格式不正确'})
      return false
    } else if (urgentMobile == userInfo.baseInfo.mobile) {
      updateToastMessage({message: '请正确填写紧急联系人手机号'})
      return false
    }
    fetch({
      url: api.QUERY_RESULT
    }).then((grayRes) => {
      if (grayRes.status == '1') {
        if (grayRes.data.gray == 'F') {
          window.location.href = '' // 跳转到系统维护页面
          return false
        } else {
          maxentEvent('quota') // 猛犸设备指纹
          session_storage.setItem('saveTime', new Date().getTime()
          fetch({
            url: api.ONECARD_AUTHINFO
          }).then((req) => {
            if (req.status == '1') {
              if (session_storage.getItem('skipCredit') == '1') { // 跳过信用卡的只看运营商
                if (req.data.operatorStatus==1) {  // 运营商已授权 才能提交
                  fetch({
                    url: api.H5_CUSTOMER_SUBMIT, // 查询保存的临时借款期限和额度接口
                    data: {
                      industry: industry,
                      profession: profession,
                      education: education,
                      marriage: marriage,
                      province: province,
                      city: city,
                      county: county,
                      address: address.replace(/\s+/g, ""),
                      email: email.replace(/\s+/g, ""), // 手动去除空格
                      company: company.replace(/\s+/g, ""),
                      relativeName: urgentName.replace(/\s+/g, ""),
                      relativePhone: urgentMobile.replace(/\s+/g, ""),
                      relative: relative
                    }
                  }).then((resposne) => {
                    if (resposne.status == '1') {
                      debugger
                      session_storage.removeItem('customerInfo')
                      // 叮当倒流 添加接口 11.11
                      if (session_storage.getItem('userLable') && (session_storage.getItem('project')=='ddcube' || session_storage.getItem('project')=='ddapp')) {
                        debugger
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
                      // window.sessionStorage.setItem('saveTime', new Date().getTime())
                    } else {
                      updateToastMessage({message: resposne.message})
                    }
                  })
                } else { // 运营商 未授权或授权中 跳到中转页 不提交
                  updateDentityInfo({customerInfo: 1})
                  session_storage.setItem('customerInfo', '1')
                  window.history.go(-1)
                }
              } else { // 没跳过信用卡的 运营商和信用卡都要看
                debugger
                if (req.data.operatorStatus==1 && req.data.creditStatus == 1) {  // 运营商和信用卡都是已授权 才能提交
                  debugger
                  fetch({
                    url: api.H5_CUSTOMER_SUBMIT, // 查询保存的临时借款期限和额度接口
                    // url: api.H5_CUSTOMER_SUBMITEXTENT, // 拆分后的接口
                    data: {
                      industry: industry,
                      profession: profession,
                      education: education,
                      marriage: marriage,
                      province: province,
                      city: city,
                      county: county,
                      address: address.replace(/\s+/g, ""),
                      email: email.replace(/\s+/g, ""), // 手动去除空格
                      company: company.replace(/\s+/g, ""),
                      relativeName: urgentName.replace(/\s+/g, ""),
                      relativePhone: urgentMobile.replace(/\s+/g, ""),
                      relative: relative
                    }
                  }).then((resposne) => {
                    if (resposne.status == '1') {
                      debugger
                      session_storage.removeItem('customerInfo')
                      // 叮当倒流 添加接口 11.11
                      if (session_storage.getItem('userLable') && (session_storage.getItem('project')=='ddcube' || session_storage.getItem('project')=='ddapp')) {
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
                    } else {
                      updateToastMessage({message: resposne.message})
                    }
                  })
                } else { // 运营商 或 信用卡是未授权或授权中 跳到中转页 不提交
                  updateDentityInfo({customerInfo: 1})
                  session_storage.setItem('customerInfo': '1')
                  window.history.go(-1)
                }
              }
            } else {
              updateToastMessage({
                message: req.message
              })
            }
          })
          // console.log('有公司吗'+company.replace(/\s+/g, ""))
        }
      } else {
        updateLoading(false)
        updateToastMessage({
          message: grayRes.message
        })
      }
    })
  }
  render () {
    let { selectFlag, selectHeight, selectList, industryText, professionText, educationText, marriageText, purposesText,
      relativeTetx, email, company, urgentName, urgentNameFlag, urgentMobile, address, addressText, adsrc, abflag } = this.state
    return (
      <section className="loanCheck">
        <ProcessHeader checked={"4"}></ProcessHeader>
        <div className="mask"></div>
        <div className={selectFlag ? 'maskwk' : 'maskwk hidden'}></div>
        <div className="loading hidden"><img src={require('icon/loading.gif')}/></div>
        <div className={selectHeight}>
          <ul className={selectFlag ? '' : 'hidden'}>
            {
              selectList.map((item, index) => {
                return <li key={index} onClick={this.selectOne.bind(this, item.value, item.parentCode, item.name)}>{item.name}</li>
              })
            }
          </ul>
        </div>
        <section className="list_con">
          <div>
            <ul className="list1">
              <li className="clearfix">
                <label className="industry">行业</label><span id="industry" className={industryText == "请选择" ? '' : 'color484848'} onClick={this.pleaseSelect.bind(this, 'industry')}>{industryText}</span>
              </li>
              <li className="clearfix">
                <label className="profession">职业</label><span id="profession" className={professionText == "请选择" ? '' : 'color484848'} onClick={this.pleaseSelect.bind(this, 'profession')}>{professionText}</span>
              </li>
              <li className="clearfix">
                <label className="education">学历</label><span id="education" className={educationText == "请选择" ? '' : 'color484848'} onClick={this.pleaseSelect.bind(this, 'education')}>{educationText}</span>
              </li>
              <li className="clearfix">
                <label className="marriage">婚姻</label><span id="marriage" className={marriageText == "请选择" ? '' : 'color484848'} onClick={this.pleaseSelect.bind(this, 'marriage')}>{marriageText}</span>
              </li>
              <li className="clearfix">
                <label className="address">通讯地址</label><span id="address" className={addressText == "请选择" ? '' : 'overFlowHide color484848'} onClick={this.goProvnice.bind(this)}>{addressText}</span>
              </li>
              <li className="clearfix email_li">
                <input id="email" onChange={this.onchange.bind(this, 'address')} type="textarea" placeholder="请填写详细地址，精确到门牌号" value={address}/>
              </li>
            </ul>
            <ul className="list2">
              <li className="clearfix email_li">
                <label className="email">常用邮箱</label><input id="email" onChange={this.onchange.bind(this, 'email')} type="text" placeholder="请填写您的邮箱" value={email}/>
              </li>
              <li className="clearfix">
                <label className="company">公司名称</label><input id="company" onChange={this.onchange.bind(this, 'company')} type="text" placeholder="请填写您的公司名称" value={company}/>
              </li>
            </ul>
            <ul className="list3">
              <li className="clearfix">
                <label className="urgentName">紧急联系人</label><input id="urgentName" onClick={this.showUrgentName.bind(this)} onChange={this.onchange.bind(this, 'urgentName')} type="text" placeholder="请填写联系人姓名" value={urgentName}/>
              </li>
              <li className="clearfix">
                <label className="urgentMobile">联系人手机号</label><input id="urgentMobile" onChange={this.onchange.bind(this, 'urgentMobile')} type="text" placeholder="请填写联系人手机号码" value={urgentMobile}/>
              </li>
              <li className="clearfix">
                <label className="relative">与本人的关系</label><span id="relative" className={relativeTetx == "请选择" ? '' : 'color484848'} onClick={this.pleaseSelect.bind(this, 'relative')}>{relativeTetx}</span>
              </li>
            </ul>
            <ul className={abflag?'list4':'list4 hidden'}>
              <li className="clearfix">
                <label>借款用途</label><span id="relative" className={purposesText == "个人或家庭消费" ? '' : 'color484848'} onClick={this.borrowresult.bind(this)}>{purposesText}</span>
              </li>
            </ul>
          </div>
        </section>
        <div><img src={adsrc}/></div>
        <button type="submit" className="btn" onClick={this.submit.bind(this)}>下一步</button>
        <div className={urgentNameFlag ? "showUrgentName" : "showUrgentName hidden"}>
          <div className="showUrgentNameMark"></div>
          <div className="showUrgentNameImg" onClick={this.closeUrgentName.bind(this)}></div>
        </div>
      </section>
    )
  }
}
