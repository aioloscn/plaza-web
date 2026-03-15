<template>
  <div class="address-edit-page">
    <van-nav-bar
      :title="isEdit ? '编辑地址' : '新增地址'"
      left-arrow
      @click-left="$router.go(-1)"
    />
    <van-address-edit
      :area-list="areaList"
      :address-info="addressInfo"
      show-delete
      show-set-default
      show-search-result
      :search-result="searchResult"
      :area-columns-placeholder="['请选择', '请选择', '请选择']"
      @save="onSave"
      @delete="onDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { areaList } from '@vant/area-data';
import { addressApi } from '@/api';
import { useUserStore } from '@/store/modules/user';
import { showToast, showDialog } from 'vant';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const addressId = route.query.id;
const isEdit = computed(() => !!addressId);
const addressInfo = ref({});
const searchResult = ref([]);

const loadAddress = async () => {
  if (isEdit.value) {
    try {
      const { data } = await addressApi.get(addressId);
      addressInfo.value = {
        id: data.id,
        name: data.name,
        tel: data.tel,
        province: data.province,
        city: data.city,
        county: data.county,
        addressDetail: data.addressDetail,
        areaCode: data.areaCode,
        isDefault: !!data.isDefault
      };
    } catch (error) {
      showToast('加载地址失败');
    }
  }
};

const onSave = async (content) => {
  const data = {
    userId: userStore.userInfo.id,
    name: content.name,
    tel: content.tel,
    province: content.province,
    city: content.city,
    county: content.county,
    addressDetail: content.addressDetail,
    areaCode: content.areaCode,
    isDefault: content.isDefault
  };

  try {
    if (isEdit.value) {
      await addressApi.update({ ...data, id: addressId });
      showToast('修改成功');
    } else {
      await addressApi.add(data);
      showToast('添加成功');
    }
    router.go(-1);
  } catch (error) {
    showToast('保存失败');
  }
};

const onDelete = () => {
  showDialog({ title: '提示', message: '确定要删除吗？', showCancelButton: true }).then(async (action) => {
      if (action === 'confirm') {
          try {
            await addressApi.delete(addressId);
            showToast('删除成功');
            router.go(-1);
          } catch (error) {
            showToast('删除失败');
          }
      }
  });
};

onMounted(() => {
  loadAddress();
});
</script>
