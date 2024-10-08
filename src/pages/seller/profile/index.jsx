import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Divider, Link as MuiLink } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import { useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { getSellerInfo, deleteSeller } from '../../../apis/seller/SellerAPI';

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: '2rem',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    marginTop: '5rem',
    padding: '1rem',
  },
}));

const FormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  width: '50%',
  padding: '1.8rem',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    padding: '1rem',
  },
}));

const Header = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '1rem',
}));

const MyProfileText = styled(Typography)(({ theme }) => ({
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ff9800',
  color: 'white',
  marginTop: '1.5rem',
  width: '10%',
  '&:hover': {
    backgroundColor: '#e68900',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const DeleteLink = styled(MuiLink)(({ theme }) => ({
  color: '#ff9800',
  marginTop: '1.5rem',
  textAlign: 'center',
  '&:hover': {
    color: '#e68900',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const ReadOnlyInputField = styled(TextField)(({ theme }) => ({
  marginTop: '1.5rem',
  marginBottom: '0.5rem',
  width: '50%',
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const ClickSettingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  marginTop: '1rem',
}));

const RadioInputs = styled('div')({
  position: 'relative',
  display: 'flex',
  flexWrap: 'wrap',
  borderRadius: '0.5rem',
  backgroundColor: '#EEE',
  boxSizing: 'border-box',
  boxShadow: '0 0 0px 1px rgba(0, 0, 0, 0.06)',
  padding: '0.25rem',
  width: '300px',
  fontSize: '14px',
});

const RadioLabel = styled('label')({
  flex: '1 1 auto',
  textAlign: 'center',
});

const RadioInput = styled('input')({
  display: 'none',
});

const RadioName = styled('span')({
  display: 'flex',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0.5rem',
  border: 'none',
  padding: '.5rem 0',
  color: 'rgba(51, 65, 85, 1)',
  transition: 'all .15s ease-in-out',
  '&.checked': {
    backgroundColor: '#fff',
    fontWeight: 600,
  },
});

const MyProfilePage = () => {
  const { loginId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [seller, setSeller] = useState({
    loginId: '',
    username: '',
    email: '',
    mobile: '',
    doneClickCountSetting: null,
  });

  useEffect(() => {
    getSellerInfo(loginId)
      .then((data) => {
        setSeller(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [loginId]);

  const handleModifyClick = () => {
    navigate(`/sellers/${loginId}/profile/modify`, { state: { seller } });
  };

  const handleDeleteClick = async () => {
    const confirmDelete = window.confirm('정말 탈퇴하시겠습니까?');
    if (confirmDelete) {
      try {
        const response = await deleteSeller(loginId);
        if (response.status === 204) {
          localStorage.removeItem('id');
          localStorage.removeItem('tokenType');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          alert('판매자 계정이 성공적으로 삭제되었습니다.');
          navigate('/login');
        }
      } catch (err) {
        alert(err.response.data.message);
      }
    }
  };

  return (
    <Container>
      <FormContainer>
        <Header>
          <MyProfileText variant="h6">My Profile</MyProfileText>
        </Header>

        <Divider sx={{ width: '100%', marginBottom: '4rem' }} />

        <ReadOnlyInputField
          label="아이디"
          variant="outlined"
          fullWidth
          InputProps={{
            readOnly: true,
          }}
          value={seller.loginId}
        />
        <ReadOnlyInputField
          label="이름"
          variant="outlined"
          fullWidth
          InputProps={{
            readOnly: true,
          }}
          value={seller.username}
        />
        <ReadOnlyInputField
          label="이메일"
          variant="outlined"
          fullWidth
          InputProps={{
            readOnly: true,
          }}
          value={seller.email}
        />
        <ReadOnlyInputField
          label="전화번호"
          variant="outlined"
          fullWidth
          InputProps={{
            readOnly: true,
          }}
          value={seller.mobile}
        />

        <ClickSettingBox>
          <RadioInputs>
            <RadioLabel className="radio">
              <RadioInput type="radio" name="radio" checked={seller.doneClickCountSetting === false} />
              <RadioName className={seller.doneClickCountSetting === false ? 'name checked' : 'name'}>한번 클릭 시 주문 완료 처리</RadioName>
            </RadioLabel>
            <RadioLabel className="radio">
              <RadioInput type="radio" name="radio" checked={seller.doneClickCountSetting === true} />
              <RadioName className={seller.doneClickCountSetting === true ? 'name checked' : 'name'}>두번 클릭 시 주문 완료 처리</RadioName>
            </RadioLabel>
          </RadioInputs>
        </ClickSettingBox>

        <StyledButton variant="contained" fullWidth onClick={handleModifyClick}>
          수정
        </StyledButton>

        <DeleteLink component="button" onClick={handleDeleteClick}>
          탈퇴하기
        </DeleteLink>
      </FormContainer>
    </Container>
  );
};

export default MyProfilePage;
