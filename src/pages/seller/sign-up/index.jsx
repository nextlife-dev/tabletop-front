import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import { Link, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { validateEmail, validatePhone, sendVerificationCode, checkLoginId } from '../../../apis/auth/AuthAPI';
import { signUp } from '../../../apis/seller/SellerAPI';
import logo from '../../../assets/logo.png';

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  [theme.breakpoints.down('md')]: {
    padding: '1rem',
  },
}));

const FormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  width: '60%',
  padding: '2rem',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    width: '100%',
    padding: '1rem',
  },
}));

const LogoBox = styled(Box)(({ theme }) => ({
  width: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRight: '1px solid #e0e0e0',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    borderRight: 'none',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '1rem',
  },
}));

const FormBox = styled(Box)(({ theme }) => ({
  width: '50%',
  padding: '0 2rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    padding: '0',
  },
}));

const SignUpPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [idValid, setIdValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState({
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    mobile: '',
  });

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'password' || name === 'confirmPassword') {
      if (!value) {
        setError('');
      } else if (value.length > 20) {
        setError('비밀번호는 최대 20자까지 입력할 수 있습니다.');
      } else if (value.length < 8) {
        setError('비밀번호는 최소 8자 이상이어야 합니다.');
      } else if (name === 'confirmPassword' && formValues.password && formValues.password !== value) {
        setError('비밀번호가 일치하지 않습니다.');
      } else {
        setError('');
      }
    } else if (name === 'username' && value.length > 0 && value.length < 2) {
      setError('판매자 이름은 최소 2자 이상이어야 합니다.');
    } else if (name === 'loginId' && /[^a-zA-Z0-9]/.test(value)) {
      setError('아이디는 영어와 숫자만 사용할 수 있습니다.');
    } else if (name === 'mobile') {
      const formattedValue = formatPhoneNumber(value);
      setFormValues({
        ...formValues,
        [name]: formattedValue,
      });
      return;
    } else {
      setError('');
    }

    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handlePhoneKeyDown = (e) => {
    const { key } = e;
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length >= 11 && key !== 'Backspace' && key !== 'Delete') {
      e.preventDefault();
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;

    if (name === 'password' || name === 'confirmPassword') {
      if (formValues.password || formValues.confirmPassword) {
        if (formValues.password.length < 8) {
          setError('비밀번호는 최소 8자 이상이어야 합니다.');
        } else if (formValues.password.length > 20) {
          setError('비밀번호는 최대 20자까지 입력할 수 있습니다.');
        } else if (formValues.password && formValues.confirmPassword && formValues.password !== formValues.confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
        } else {
          setError('');
        }
      }
    } else if (name === 'username' && formValues.username.length > 0 && formValues.username.length < 2) {
      setError('판매자 이름은 최소 2자 이상이어야 합니다.');
    } else if (name === 'loginId' && /[^a-zA-Z0-9]/.test(formValues.loginId)) {
      setError('아이디는 영어와 숫자만 사용할 수 있습니다.');
    } else {
      setError('');
    }
  };

  const handleEmailValidation = async () => {
    try {
      const response = await validateEmail(formValues.email);
      const { is_valid_format, is_smtp_valid } = response;

      if (is_valid_format.value && is_smtp_valid.value) {
        alert('이메일이 유효합니다.');
        sendVerificationCodeToEmail();
      } else if (!is_valid_format.value && !is_smtp_valid.value) {
        alert('입력하신 이메일 주소가 유효하지 않습니다. 올바른 이메일을 입력해주세요.');
        setEmailValid(false);
      } else if (is_valid_format.value && !is_smtp_valid.value) {
        alert('이메일 형식은 맞으나 인증된 이메일이 아닙니다. 이메일 인증이 필요합니다.');
        sendVerificationCodeToEmail();
      }
    } catch (err) {
      console.error('이메일 검증 실패:', err);
      alert('이메일 검증 중 오류가 발생했습니다.');
      setEmailValid(false);
    }
  };

  const sendVerificationCodeToEmail = async () => {
    try {
      const response = await sendVerificationCode(formValues.email);
      if (response) {
        alert('이메일로 인증 코드가 전송되었습니다.');
        setServerVerificationCode(response);
        setVerificationSent(true);
      } else {
        alert('인증 코드 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error('인증 코드 전송 실패:', err);
      alert('인증 코드 전송 중 오류가 발생했습니다.');
    }
  };

  const handlePhoneValidation = async () => {
    try {
      const response = await validatePhone(formValues.mobile);
      const { valid } = response;

      if (valid) {
        alert('휴대폰 번호가 유효합니다.');
        setPhoneValid(true);
        setError('');
      } else {
        alert('입력하신 휴대폰 번호가 유효하지 않습니다. 올바른 휴대폰 번호를 입력해주세요.');
        setPhoneValid(false);
      }
    } catch (err) {
      console.error('휴대폰 번호 검증 실패:', err);
      alert('휴대폰 번호 검증 중 오류가 발생했습니다.');
      setPhoneValid(false);
    }
  };

  const handleLoginIdCheck = async () => {
    if (!formValues.loginId) {
      alert('아이디를 입력해주세요.');
      return;
    }

    if (/[^a-zA-Z0-9]/.test(formValues.loginId)) {
      setError('아이디는 영어와 숫자만 사용할 수 있습니다.');
      return;
    }

    try {
      const response = await checkLoginId(formValues.loginId);
      alert(response);
      setIdValid(true);
      setError('');
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  const validateForm = () => {
    const { loginId, email, password, confirmPassword, username, mobile } = formValues;

    if (/[^a-zA-Z0-9]/.test(loginId)) {
      setError('아이디는 영어와 숫자만 사용할 수 있습니다.');
      return false;
    }

    if (!loginId || !email || !password || !confirmPassword || !username || !mobile) {
      setError('모든 정보를 입력해야 합니다.');
      return false;
    }

    if (!idValid) {
      setError('아이디 중복 검증을 완료해야 합니다.');
      return false;
    }

    if (!emailValid) {
      setError('이메일 확인 검증을 완료해야 합니다.');
      return false;
    }

    if (!phoneValid) {
      setError('휴대폰 전화번호 유효성 검증을 완료해야 합니다.');
      return false;
    }

    if (password.length < 8 || password.length > 20) {
      setError('비밀번호는 최소 8자 이상, 최대 20자 이하이어야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { loginId, email, password, username, mobile } = formValues;
    try {
      const response = await signUp({ loginId, email, password, username, mobile });
      alert(response);
      navigate('/login');
    } catch (err) {
      alert('회원가입에 실패했습니다.');
    }
  };

  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleVerificationCodeSubmit = () => {
    if (verificationCode === serverVerificationCode) {
      alert('이메일 인증이 완료되었습니다.');
      setEmailValid(true);
      setError('');
    } else {
      alert('인증 코드가 일치하지 않습니다. 다시 확인해주세요.');
      setEmailValid(false);
    }
  };

  return (
    <Container>
      <FormContainer>
        <LogoBox>
        <Box
            component="img"
            src={logo}
            alt="logo"
            sx={{
              width: isMobile ? '200px' : '300px',
              height: isMobile ? '200px' : '300px',
            }}
          />
        </LogoBox>
        <FormBox>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h1" gutterBottom>
              회원가입
            </Typography>
            {error && <Typography color="error">{error}</Typography>}
          </Box>
          <TextField
            label="아이디"
            variant="outlined"
            margin="normal"
            fullWidth
            name="loginId"
            value={formValues.loginId}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: '0.5rem' }}
            onClick={handleLoginIdCheck}
          >
            아이디 중복 검사
          </Button>
          <TextField
            label="이메일"
            variant="outlined"
            margin="normal"
            fullWidth
            name="email"
            value={formValues.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: '0.5rem' }}
            onClick={handleEmailValidation}
          >
            이메일 확인
          </Button>
          {verificationSent && (
            <Box mt={2}>
              <TextField
                label="인증 코드 입력"
                variant="outlined"
                margin="normal"
                fullWidth
                onChange={handleVerificationCodeChange}
                required
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ marginTop: '0.5rem' }}
                onClick={handleVerificationCodeSubmit}
              >
                인증 코드 확인
              </Button>
            </Box>
          )}
          <TextField
            label="비밀번호"
            type="password"
            variant="outlined"
            margin="normal"
            fullWidth
            name="password"
            value={formValues.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          <TextField
            label="비밀번호 확인"
            type="password"
            variant="outlined"
            margin="normal"
            fullWidth
            name="confirmPassword"
            value={formValues.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          <TextField
            label="이름"
            variant="outlined"
            margin="normal"
            fullWidth
            name="username"
            value={formValues.username}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="전화번호"
              variant="outlined"
              fullWidth
              name="mobile"
              value={formValues.mobile}
              onChange={handleChange}
              onKeyDown={handlePhoneKeyDown}  
              required           
            />
            <Button variant="contained" sx={{ marginLeft: '0.5rem', height: '56px' }} onClick={handlePhoneValidation}>
              확인
            </Button>
          </Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: '1rem' }}
            onClick={handleSignUp}
          >
            가입
          </Button>
          <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2', marginTop: '1rem', textAlign: 'center' }}>
            뒤로가기
          </Link>
        </FormBox>
      </FormContainer>
    </Container>
  );
};

export default SignUpPage;